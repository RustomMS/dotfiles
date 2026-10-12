import { readFile, stat } from "node:fs/promises";
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { truncateToWidth } from "@earendil-works/pi-tui";
import {
  applyActivity,
  buildSnapshot,
  collectTrackedSubagents,
  formatSubagentSummary,
  isCurrentTrackerSession,
  OVERVIEW_VISIBILITY_EVENT,
  parseSessionCost,
  SUBAGENT_SNAPSHOT_EVENT,
  SUBAGENT_SNAPSHOT_REQUEST_EVENT,
  type SubagentSnapshot,
  type SubagentStatus,
  type TrackedSubagent,
} from "./tracker.ts";

const WIDGET_KEY = "subagent-history";
const SUMMARY_STATUS_KEY = "subagent-summary";
const REFRESH_INTERVAL_MS = 1000;
const OVERVIEW_SHORTCUT = "ctrl+super+s";

interface CostCacheEntry {
  size: number;
  modifiedAt: number;
  cost: number;
  valid: boolean;
}

function formatCost(cost: number | undefined): string {
  return cost === undefined ? "$?" : `$${cost.toFixed(3)}`;
}

function formatDuration(seconds: number): string {
  const totalSeconds = Math.max(0, Math.floor(seconds));
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return hours > 0 ? `${hours}h${minutes}m` : `${minutes}m${totalSeconds % 60}s`;
}

function elapsedSeconds(agent: TrackedSubagent, now: number): number {
  return agent.elapsedSeconds ?? (now - agent.launchedAt) / 1000;
}

function statusDisplay(
  status: SubagentStatus,
): { marker: string; colour: "success" | "warning" | "error" | "muted" } {
  switch (status) {
    case "active":
      return { marker: "●", colour: "success" };
    case "starting":
      return { marker: "…", colour: "warning" };
    case "waiting":
      return { marker: "○", colour: "warning" };
    case "completed":
      return { marker: "✓", colour: "success" };
    case "failed":
      return { marker: "✗", colour: "error" };
    case "interrupted":
      return { marker: "■", colour: "warning" };
    default:
      return { marker: "?", colour: "muted" };
  }
}

async function readActivity(agent: TrackedSubagent): Promise<unknown> {
  for (const path of agent.activityFileCandidates) {
    try {
      return JSON.parse(await readFile(path, "utf8"));
    } catch {
      // Try the alternate path used by older pi-herdr-subagents versions.
    }
  }
  return undefined;
}

export default function (pi: ExtensionAPI) {
  let snapshot: SubagentSnapshot | undefined;
  let timer: ReturnType<typeof setInterval> | undefined;
  let requestRender: (() => void) | undefined;
  let widgetInstalled = false;
  let overviewVisible = false;
  let syncOverview: (() => void) | undefined;
  let activeSessionId: string | undefined;
  let lifecycleGeneration = 0;

  function publish(): void {
    if (snapshot) pi.events.emit(SUBAGENT_SNAPSHOT_EVENT, snapshot);
    requestRender?.();
  }

  pi.events.on(SUBAGENT_SNAPSHOT_REQUEST_EVENT, () => publish());

  function toggleOverview(ctx: ExtensionContext): void {
    overviewVisible = !overviewVisible;
    syncOverview?.();
    pi.events.emit(OVERVIEW_VISIBILITY_EVENT, { visible: overviewVisible });
    ctx.ui.notify(`Subagent and advisor overview ${overviewVisible ? "shown" : "hidden"}`, "info");
  }

  pi.registerCommand("subagents-overview", {
    description: "Toggle the current session's subagent overview",
    handler: async (_args, ctx) => toggleOverview(ctx),
  });

  pi.registerShortcut(OVERVIEW_SHORTCUT, {
    description: "Toggle subagent and advisor overview",
    handler: async (ctx) => toggleOverview(ctx),
  });

  pi.on("session_start", (_event, ctx) => {
    if (timer) clearInterval(timer);
    const generation = ++lifecycleGeneration;
    activeSessionId = ctx.sessionManager.getSessionId();
    snapshot = undefined;
    widgetInstalled = false;
    overviewVisible = false;
    requestRender = undefined;
    ctx.ui.setWidget(WIDGET_KEY, undefined);
    ctx.ui.setStatus(SUMMARY_STATUS_KEY, undefined);
    ctx.ui.setStatus("subagent-tracker", undefined);
    const costCache = new Map<string, CostCacheEntry>();
    let refreshInProgress = false;
    let lastErrorReportedAt = 0;

    syncOverview = () => {
      if (!overviewVisible || !snapshot || snapshot.agents.length === 0) {
        if (widgetInstalled) ctx.ui.setWidget(WIDGET_KEY, undefined);
        widgetInstalled = false;
        requestRender = undefined;
        return;
      }
      if (widgetInstalled) {
        requestRender?.();
        return;
      }

      widgetInstalled = true;
      ctx.ui.setWidget(
        WIDGET_KEY,
        (tui, theme) => {
          requestRender = () => tui.requestRender();
          return {
            invalidate() {},
            render(width: number): string[] {
              const current = snapshot;
              if (!current || current.agents.length === 0) return [];
              const activeCount = current.agents.filter((agent) =>
                agent.status === "active" || agent.status === "starting",
              ).length;
              const unknownSuffix = current.costsComplete ? "" : "+";
              const heading = theme.fg(
                "accent",
                `Subagents ${current.agents.length} · $${current.totalCost.toFixed(3)}${unknownSuffix}` +
                  (activeCount > 0 ? ` · ${activeCount} active` : ""),
              );
              const lines = current.agents.map((agent) => {
                const display = statusDisplay(agent.status);
                const role = agent.agent ? ` (${agent.agent})` : "";
                const model = agent.model ? ` · ${agent.model.split("/").at(-1)}` : "";
                const duration = formatDuration(elapsedSeconds(agent, Date.now()));
                const line = `${display.marker} ${agent.name}${role} · ${agent.status}${model} · ${duration} · ${formatCost(agent.cost)}`;
                return truncateToWidth(theme.fg(display.colour, line), width, "...");
              });
              return [truncateToWidth(heading, width, "..."), ...lines];
            },
          };
        },
        { placement: "belowEditor" },
      );
    };

    const refresh = async (): Promise<void> => {
      const sessionId = activeSessionId;
      if (refreshInProgress || !sessionId) return;
      refreshInProgress = true;
      try {
        const now = Date.now();
        const leafId = ctx.sessionManager.getLeafId();
        // Display only launches/results on the active branch. The child may
        // inherit entries from any parent branch, so cost exclusion uses all IDs.
        const parentEntries = ctx.sessionManager.getBranch();
        const inheritedEntryIds = new Set(
          ctx.sessionManager.getEntries()
            .map((entry) => entry.id)
            .filter((id): id is string => typeof id === "string"),
        );
        const agents = collectTrackedSubagents(parentEntries, now);

        await Promise.all(
          agents.map(async (agent) => {
            try {
              const fileStat = await stat(agent.sessionFile);
              const cached = costCache.get(agent.sessionFile);
              if (cached?.size === fileStat.size && cached.modifiedAt === fileStat.mtimeMs) {
                agent.cost = cached.valid ? cached.cost : undefined;
              } else {
                const parsed = parseSessionCost(
                  await readFile(agent.sessionFile, "utf8"),
                  inheritedEntryIds,
                );
                costCache.set(agent.sessionFile, {
                  size: fileStat.size,
                  modifiedAt: fileStat.mtimeMs,
                  ...parsed,
                });
                agent.cost = parsed.valid ? parsed.cost : undefined;
              }
            } catch {
              agent.cost = undefined;
            }

            applyActivity(agent, await readActivity(agent));
          }),
        );

        if (!isCurrentTrackerSession(generation, lifecycleGeneration, sessionId, activeSessionId) ||
            leafId !== ctx.sessionManager.getLeafId()) return;
        snapshot = buildSnapshot(sessionId, agents, now);
        ctx.ui.setStatus("subagent-tracker", undefined);
        ctx.ui.setStatus(SUMMARY_STATUS_KEY, formatSubagentSummary(snapshot));
        syncOverview();
        publish();
      } finally {
        refreshInProgress = false;
      }
    };

    const scheduleRefresh = (): void => {
      void refresh().catch((error: unknown) => {
        if (generation !== lifecycleGeneration) return;
        ctx.ui.setStatus("subagent-tracker", "subagents: tracking error");
        const now = Date.now();
        if (now - lastErrorReportedAt >= 30_000) {
          lastErrorReportedAt = now;
          console.error("Subagent tracker refresh failed", error);
        }
      });
    };
    scheduleRefresh();
    timer = setInterval(scheduleRefresh, REFRESH_INTERVAL_MS);
  });

  pi.on("session_shutdown", (_event, ctx) => {
    lifecycleGeneration++;
    if (timer) clearInterval(timer);
    timer = undefined;
    activeSessionId = undefined;
    snapshot = undefined;
    requestRender = undefined;
    syncOverview = undefined;
    widgetInstalled = false;
    overviewVisible = false;
    ctx.ui.setWidget(WIDGET_KEY, undefined);
    ctx.ui.setStatus(SUMMARY_STATUS_KEY, undefined);
    ctx.ui.setStatus("subagent-tracker", undefined);
  });
}
