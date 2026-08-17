/**
 * Custom footer extension — moves the model name to appear right before the current directory,
 * and adds AI turn time / total session time right-aligned on the stats line.
 *
 * Line 1: model ~/path (branch) • session              cache 3m42s • mcp: A/N
 * Line 2: ↑tokens ↓tokens R/W cache CH% K<count> $cost ctx%/window  req: 42s • aiTime/sessionTime
 * Line 3 (optional): non-MCP extension statuses
 */

import { isAbsolute, relative, resolve, sep } from "node:path";
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { truncateToWidth, visibleWidth } from "@mariozechner/pi-tui";

// ANSI yellow (33) matching ~/.claude/statusline-command.sh
const STATS_YELLOW = "\x1b[33m";
const ANSI_RESET = "\x1b[0m";
const CACHE_KEEP_LIVE_RESULT = "cache-keep-live-result";

interface UsageLike {
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
  cost: { total: number };
}

function getKeepaliveUsage(data: unknown): UsageLike | undefined {
  if (!data || typeof data !== "object") return undefined;
  const usage = (data as { usage?: unknown }).usage;
  if (!usage || typeof usage !== "object") return undefined;
  const candidate = usage as Partial<UsageLike>;
  if (
    typeof candidate.input !== "number" ||
    typeof candidate.output !== "number" ||
    typeof candidate.cacheRead !== "number" ||
    typeof candidate.cacheWrite !== "number" ||
    !candidate.cost ||
    typeof candidate.cost.total !== "number"
  ) {
    return undefined;
  }
  return candidate as UsageLike;
}

function formatTokens(count: number): string {
  if (count < 1000) return count.toString();
  if (count < 10_000) return `${(count / 1000).toFixed(1)}k`;
  if (count < 1_000_000) return `${Math.round(count / 1000)}k`;
  if (count < 10_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  return `${Math.round(count / 1_000_000)}M`;
}

function formatDuration(ms: number): string {
  const totalSecs = Math.floor(ms / 1000);
  if (totalSecs < 60) return `${totalSecs}s`;
  const hours = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;
  if (hours > 0) return `${hours}h${mins}m`;
  return `${mins}m${secs}s`;
}

// Mirrors Pi's default footer, including path-boundary checks that a string prefix misses.
function formatCwd(cwd: string, home: string | undefined): string {
  if (!home) return cwd;
  const resolvedCwd = resolve(cwd);
  const resolvedHome = resolve(home);
  const relativeToHome = relative(resolvedHome, resolvedCwd);
  const isInsideHome =
    relativeToHome === "" ||
    (relativeToHome !== ".." &&
      !relativeToHome.startsWith(`..${sep}`) &&
      !isAbsolute(relativeToHome));
  if (!isInsideHome) return cwd;
  return relativeToHome === "" ? "~" : `~${sep}${relativeToHome}`;
}

function alignRight(left: string, right: string, width: number): string {
  let fittedLeft = left;
  let leftWidth = visibleWidth(fittedLeft);
  if (leftWidth > width) {
    fittedLeft = truncateToWidth(fittedLeft, width, "...");
    leftWidth = visibleWidth(fittedLeft);
  }

  const minPadding = 2;
  const availableForRight = width - leftWidth - minPadding;
  if (availableForRight <= 0) return fittedLeft;

  const fittedRight = truncateToWidth(right, availableForRight, "");
  const rightWidth = visibleWidth(fittedRight);
  const padding = " ".repeat(Math.max(0, width - leftWidth - rightWidth));
  return `${fittedLeft}${padding}${fittedRight}`;
}

function formatMcpStatus(text: string | undefined): string | undefined {
  if (!text) return undefined;
  const plainText = text.replace(/\x1b\[[0-?]*[ -/]*[@-~]/g, "");
  const enabledCount = plainText.match(/MCP:\s*(\d+)\s+servers? enabled/i)?.[1];
  const compactConnectedCount = plainText.match(/MCP\s+(\d+)\/\d+/i)?.[1];
  const count = enabledCount ?? compactConnectedCount;
  return count ? `mcp: ${count}` : undefined;
}

function bootstrapLastRequestMs(
  ctx: Parameters<Parameters<ExtensionAPI["on"]>[1]>[1],
): number | undefined {
  const entries = ctx.sessionManager.getEntries();
  for (let index = entries.length - 1; index >= 0; index--) {
    const entry = entries[index];
    if (entry?.type === "message" && entry.message.role === "assistant") {
      return new Date(entry.timestamp).getTime();
    }
  }
  return undefined;
}

/** One-time scan of existing entries to bootstrap AI turn time for resumed sessions. */
function bootstrapAiTurnMs(ctx: Parameters<Parameters<ExtensionAPI["on"]>[1]>[1]): number {
  let total = 0;
  for (const entry of ctx.sessionManager.getEntries()) {
    if (
      entry.type === "message" &&
      entry.message.role === "assistant" &&
      entry.parentId !== null
    ) {
      const parent = ctx.sessionManager.getEntry(entry.parentId);
      if (parent) {
        const diff = new Date(entry.timestamp).getTime() - new Date(parent.timestamp).getTime();
        if (diff > 0) total += diff;
      }
    }
  }
  return total;
}

export default function (pi: ExtensionAPI) {
  let tui: { requestRender(): void } | undefined;
  let mcpAuthStatus: string | undefined;

  pi.events.on("pi-mcp-adapter/status/v1", (data) => {
    const snapshot = data as {
      servers?: ReadonlyArray<{ status?: string; disabled?: boolean }>;
    };
    if (!Array.isArray(snapshot.servers) || snapshot.servers.length === 0) {
      mcpAuthStatus = undefined;
    } else {
      const enabledServers = snapshot.servers.filter((server) => !server.disabled);
      const needsAuth = enabledServers.filter((server) => server.status === "needs-auth").length;
      mcpAuthStatus = `mcp: ${enabledServers.length - needsAuth}/${enabledServers.length}`;
    }
    tui?.requestRender();
  });

  pi.on("session_start", (_event, ctx) => {
    // Bootstrap from existing entries (non-zero only on resumed sessions).
    let aiTurnMs = bootstrapAiTurnMs(ctx);
    // Resumed sessions do not persist request-start time; latest response is the best fallback.
    let lastRequestMs = bootstrapLastRequestMs(ctx);
    let turnStartMs = 0;

    // From here on, accumulate incrementally via events — O(1) per render.
    pi.on("turn_start", (event) => {
      turnStartMs = event.timestamp;
    });

    pi.on("before_provider_request", () => {
      lastRequestMs = Date.now();
      tui?.requestRender();
    });

    pi.on("turn_end", () => {
      if (turnStartMs > 0) {
        aiTurnMs += Date.now() - turnStartMs;
        turnStartMs = 0;
      }
      tui?.requestRender();
    });

    pi.on("model_select", () => tui?.requestRender());

    ctx.ui.setFooter((_tui, theme, footerData) => {
      tui = _tui;

      const unsubBranch = footerData.onBranchChange(() => _tui.requestRender());
      const elapsedTimer = setInterval(() => _tui.requestRender(), 1000);

      return {
        dispose() {
          unsubBranch();
          clearInterval(elapsedTimer);
          tui = undefined;
        },
        invalidate() {},
        render(width: number): string[] {
          // --- Line 1: model (+ thinking level) + pwd + branch + session ---
          const modelId = ctx.model?.id ?? "no-model";
          const thinkingLevel = pi.getThinkingLevel();
          const thinkingSuffix = ctx.model?.reasoning
            ? thinkingLevel === "off" ? " • thinking off" : ` • ${thinkingLevel}`
            : "";

          let pwd = formatCwd(
            ctx.sessionManager.getCwd(),
            process.env.HOME ?? process.env.USERPROFILE,
          );

          const branch = footerData.getGitBranch();
          const sessionName = ctx.sessionManager.getSessionName();

          const branchPart = branch ? ` (${theme.fg("error", branch)})` : "";
          const sessionPart = sessionName ? theme.fg("dim", ` • ${sessionName}`) : "";
          let modelLabel = modelId;
          const showProvider = footerData.getAvailableProviderCount() > 1 && ctx.model;
          if (showProvider) modelLabel = `(${ctx.model.provider}) ${modelId}`;
          const buildPwd = (label: string) =>
            `${theme.fg("success", label)}${theme.fg("dim", thinkingSuffix)} ${theme.fg("accent", pwd)}${branchPart}${sessionPart}`;
          let pwdColored = buildPwd(modelLabel);
          const extensionStatuses = footerData.getExtensionStatuses();
          const mcpStatus = mcpAuthStatus ?? formatMcpStatus(extensionStatuses.get("mcp"));
          const cacheStatus = extensionStatuses.get("cache-keep-live");
          const rightStatuses = [cacheStatus, mcpStatus].filter(
            (status): status is string => Boolean(status),
          );
          let pwdLine = truncateToWidth(pwdColored, width, theme.fg("dim", "..."));
          if (rightStatuses.length > 0) {
            const authCounts = mcpStatus?.match(/mcp:\s*(\d+)\/(\d+)/);
            const mcpNeedsAuth = authCounts ? Number(authCounts[1]) < Number(authCounts[2]) : false;
            const rightColored = rightStatuses
              .map((status) =>
                status === mcpStatus
                  ? theme.fg(mcpNeedsAuth ? "warning" : "dim", status)
                  : theme.fg("dim", status),
              )
              .join(theme.fg("dim", " • "));
            const rightText = rightStatuses.join(" • ");
            if (showProvider && visibleWidth(pwdColored) + visibleWidth(rightText) + 2 > width) {
              pwdColored = buildPwd(modelId);
            }
            pwdLine = alignRight(pwdColored, rightColored, width);
          }

          // --- Timing ---
          const header = ctx.sessionManager.getHeader();
          const sessionStartMs = header ? new Date(header.timestamp).getTime() : Date.now();
          const sessionDurationMs = Date.now() - sessionStartMs;
          // Include elapsed time of any in-progress turn live.
          const liveAiTurnMs = aiTurnMs + (turnStartMs > 0 ? Date.now() - turnStartMs : 0);
          const requestStatus = lastRequestMs
            ? `req: ${formatDuration(Date.now() - lastRequestMs)} • `
            : "";
          const timeStr = `${requestStatus}${formatDuration(liveAiTurnMs)}/${formatDuration(sessionDurationMs)}`;

          // --- Line 2: token stats (left) + time (right) ---
          const usageTotals = {
            input: 0,
            output: 0,
            cacheRead: 0,
            cacheWrite: 0,
            cost: 0,
          };
          let latestCacheHitRate: number | undefined;
          let keepaliveCount = 0;

          // Match Pi's default accounting and include hidden cache keepalive requests.
          for (const entry of ctx.sessionManager.getEntries()) {
            let usage: UsageLike | undefined;
            let updatesCacheHitRate = false;
            if (entry.type === "message" && entry.message.role === "assistant") {
              usage = entry.message.usage;
              updatesCacheHitRate = true;
            } else if (
              entry.type === "message" &&
              entry.message.role === "toolResult" &&
              entry.message.usage
            ) {
              usage = entry.message.usage;
            } else if (
              (entry.type === "branch_summary" || entry.type === "compaction") &&
              entry.usage
            ) {
              usage = entry.usage;
            } else if (entry.type === "custom" && entry.customType === CACHE_KEEP_LIVE_RESULT) {
              usage = getKeepaliveUsage(entry.data);
              if (usage) {
                keepaliveCount++;
                updatesCacheHitRate = true;
              }
            }
            if (!usage) continue;
            if (updatesCacheHitRate) {
              const promptTokens = usage.input + usage.cacheRead + usage.cacheWrite;
              latestCacheHitRate =
                promptTokens > 0 ? (usage.cacheRead / promptTokens) * 100 : undefined;
            }
            usageTotals.input += usage.input;
            usageTotals.output += usage.output;
            usageTotals.cacheRead += usage.cacheRead;
            usageTotals.cacheWrite += usage.cacheWrite;
            usageTotals.cost += usage.cost.total;
          }

          const contextUsage = ctx.getContextUsage();
          const contextWindow = contextUsage?.contextWindow ?? ctx.model?.contextWindow ?? 0;
          const contextPercentValue = contextUsage?.percent ?? 0;
          const contextPercent =
            contextUsage?.percent != null ? contextPercentValue.toFixed(1) : "?";

          const statsParts: string[] = [];
          if (usageTotals.input) statsParts.push(`↑${formatTokens(usageTotals.input)}`);
          if (usageTotals.output) statsParts.push(`↓${formatTokens(usageTotals.output)}`);
          if (usageTotals.cacheRead) statsParts.push(`R${formatTokens(usageTotals.cacheRead)}`);
          if (usageTotals.cacheWrite) statsParts.push(`W${formatTokens(usageTotals.cacheWrite)}`);
          if (
            (usageTotals.cacheRead > 0 || usageTotals.cacheWrite > 0) &&
            latestCacheHitRate !== undefined
          ) {
            statsParts.push(`CH${latestCacheHitRate.toFixed(1)}%`);
          }
          if (keepaliveCount > 0) statsParts.push(`K${keepaliveCount}`);
          const provider = ctx.model ? ctx.modelRegistry.getProvider(ctx.model.provider) : undefined;
          const usingSubscription = ctx.model
            ? ctx.model.provider === "kimi-coding" ||
              (ctx.modelRegistry.isUsingOAuth(ctx.model) && provider?.auth.oauth?.isSubscription === true)
            : false;
          if (usageTotals.cost || usingSubscription) {
            statsParts.push(`$${usageTotals.cost.toFixed(3)}${usingSubscription ? " (sub)" : ""}`);
          }

          const contextDisplay =
            contextPercent === "?"
              ? `?/${formatTokens(contextWindow)}`
              : `${contextPercent}%/${formatTokens(contextWindow)}`;
          let contextStr: string;
          if (contextPercentValue > 90) {
            contextStr = theme.fg("error", contextDisplay);
          } else if (contextPercentValue > 70) {
            contextStr = theme.fg("warning", contextDisplay);
          } else {
            contextStr = contextDisplay;
          }
          statsParts.push(contextStr);

          const statsLeft = `${STATS_YELLOW}${statsParts.join(" ")}${ANSI_RESET}`;
          const statsLine = alignRight(statsLeft, theme.fg("dim", timeStr), width);

          // --- Line 3: extension statuses (optional) ---
          const lines: string[] = [pwdLine, statsLine];

          const otherStatuses = Array.from(extensionStatuses.entries())
            .filter(([key]) => key !== "mcp" && key !== "cache-keep-live")
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([, text]) => text.replace(/[\r\n\t]/g, " ").replace(/ +/g, " ").trim());
          if (otherStatuses.length > 0) {
            lines.push(
              truncateToWidth(otherStatuses.join(" "), width, theme.fg("dim", "...")),
            );
          }

          return lines;
        },
      };
    });
  });
}
