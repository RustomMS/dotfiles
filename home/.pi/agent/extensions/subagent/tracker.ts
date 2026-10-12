import { dirname, join } from "node:path";

export const SUBAGENT_SNAPSHOT_EVENT = "subagent-tracker/snapshot/v1";
export const SUBAGENT_SNAPSHOT_REQUEST_EVENT = "subagent-tracker/request/v1";
// Emitted with { visible: boolean } when the overview shortcut toggles; custom-footer.ts shows the advisor view with it.
export const OVERVIEW_VISIBILITY_EVENT = "ai-config/overview-visibility/v1";

export type SubagentStatus =
  | "starting"
  | "active"
  | "waiting"
  | "completed"
  | "failed"
  | "interrupted"
  | "unknown";

export interface TrackedSubagent {
  id: string;
  name: string;
  agent?: string;
  task?: string;
  model?: string;
  sessionFile: string;
  launchScriptFile?: string;
  launchedAt: number;
  completedAt?: number;
  elapsedSeconds?: number;
  status: SubagentStatus;
  exitCode?: number;
  cost?: number;
  activityFileCandidates: string[];
}

export interface SubagentSnapshot {
  parentSessionId: string;
  agents: TrackedSubagent[];
  totalCost: number;
  costsComplete: boolean;
  updatedAt: number;
}

export function isCurrentTrackerSession(
  generation: number,
  activeGeneration: number,
  sessionId: string,
  activeSessionId: string | undefined,
): boolean {
  return generation === activeGeneration && sessionId === activeSessionId;
}

export function formatSubagentSummary(snapshot: SubagentSnapshot): string | undefined {
  const displayedCost = snapshot.totalCost.toFixed(3);
  if (snapshot.agents.length === 0 || displayedCost === "0.000") return undefined;
  const incompleteMarker = snapshot.costsComplete ? "" : "+";
  return `+ sub-agents $${displayedCost}${incompleteMarker}`;
}

interface UsageLike {
  cost?: { total?: unknown };
}

interface ParentEntry {
  type?: unknown;
  id?: unknown;
  timestamp?: unknown;
  customType?: unknown;
  details?: unknown;
  message?: unknown;
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function asFiniteNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function timestampMs(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return undefined;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function activityFileCandidates(launchScriptFile: string | undefined, id: string): string[] {
  if (!launchScriptFile) return [];
  const artifactDirectory = dirname(dirname(launchScriptFile));
  return [
    join(artifactDirectory, "subagent-activity", `${id}.json`),
    join(artifactDirectory, `subagent-activity-${id}.json`),
  ];
}

function findAgentForCompletion(
  agents: TrackedSubagent[],
  details: Record<string, unknown>,
): TrackedSubagent | undefined {
  const sessionFile = typeof details.sessionFile === "string" ? details.sessionFile : undefined;
  if (sessionFile) {
    const matches = agents.filter((agent) => agent.sessionFile === sessionFile);
    if (matches.length === 1) return matches[0];
  }

  const name = typeof details.name === "string" ? details.name : undefined;
  if (!name) return undefined;
  const matches = agents.filter(
    (agent) => agent.name === name && agent.status !== "completed" && agent.status !== "failed",
  );
  return matches.length === 1 ? matches[0] : undefined;
}

export function collectTrackedSubagents(entries: readonly ParentEntry[], now: number): TrackedSubagent[] {
  const agents: TrackedSubagent[] = [];

  for (const entry of entries) {
    const message = asRecord(entry.message);
    if (entry.type === "message" && message?.role === "toolResult") {
      const details = asRecord(message.details);
      if (message.toolName === "subagent" && details?.status === "started") {
        const id = typeof details.id === "string" ? details.id : undefined;
        const name = typeof details.name === "string" ? details.name : undefined;
        const sessionFile = typeof details.sessionFile === "string" ? details.sessionFile : undefined;
        if (!id || !name || !sessionFile || agents.some((agent) => agent.id === id)) continue;
        const launchScriptFile =
          typeof details.launchScriptFile === "string" ? details.launchScriptFile : undefined;
        agents.push({
          id,
          name,
          agent: typeof details.agent === "string" ? details.agent : undefined,
          task: typeof details.task === "string" ? details.task : undefined,
          model: typeof details.model === "string" ? details.model : undefined,
          sessionFile,
          launchScriptFile,
          launchedAt: timestampMs(entry.timestamp) ?? now,
          status: "starting",
          activityFileCandidates: activityFileCandidates(launchScriptFile, id),
        });
        continue;
      }

      if (message.toolName === "subagent_interrupt" && details?.status === "interrupt_requested") {
        const id = typeof details.id === "string" ? details.id : undefined;
        const agent = id ? agents.find((candidate) => candidate.id === id) : undefined;
        if (agent && agent.status !== "completed" && agent.status !== "failed") {
          agent.status = "interrupted";
        }
      }
      continue;
    }

    if (entry.type !== "custom_message") continue;
    const details = asRecord(entry.details);
    if (!details) continue;
    const agent = findAgentForCompletion(agents, details);
    if (!agent) continue;

    if (entry.customType === "subagent_ping") {
      agent.status = "waiting";
      continue;
    }
    if (entry.customType !== "subagent_result") continue;

    const elapsedSeconds = asFiniteNumber(details.elapsed);
    const exitCode = asFiniteNumber(details.exitCode);
    agent.elapsedSeconds = elapsedSeconds;
    agent.completedAt = elapsedSeconds !== undefined
      ? agent.launchedAt + elapsedSeconds * 1000
      : timestampMs(entry.timestamp);
    agent.exitCode = exitCode;
    agent.status = details.error !== undefined || exitCode === undefined || exitCode !== 0
      ? "failed"
      : "completed";
  }

  return agents;
}

function usageCost(value: unknown): number {
  const usage = asRecord(value) as UsageLike | undefined;
  const total = usage?.cost?.total;
  return typeof total === "number" && Number.isFinite(total) ? total : 0;
}

export function parseSessionCost(
  jsonl: string,
  inheritedEntryIds: ReadonlySet<string>,
): { cost: number; valid: boolean } {
  let sawHeader = false;
  let cost = 0;

  for (const line of jsonl.split("\n")) {
    if (!line.trim()) continue;
    let entry: Record<string, unknown>;
    try {
      entry = JSON.parse(line) as Record<string, unknown>;
    } catch {
      // A child may be writing the final JSONL record while we read it.
      continue;
    }

    if (entry.type === "session") {
      sawHeader = true;
      continue;
    }
    if (typeof entry.id === "string" && inheritedEntryIds.has(entry.id)) continue;

    if (entry.type === "message") {
      const message = asRecord(entry.message);
      if (message?.role === "assistant" || message?.role === "toolResult") {
        cost += usageCost(message.usage);
      }
    } else if (entry.type === "branch_summary" || entry.type === "compaction") {
      cost += usageCost(entry.usage);
    } else if (entry.type === "usage") {
      cost += usageCost(entry.usage);
    } else if (entry.type === "custom" && entry.customType === "cache-keep-live-result") {
      const data = asRecord(entry.data);
      cost += usageCost(data?.usage);
    }
  }

  return { cost, valid: sawHeader };
}

export function applyActivity(agent: TrackedSubagent, activity: unknown): void {
  if (agent.status === "completed" || agent.status === "failed") return;
  const value = asRecord(activity);
  if (!value || value.runningChildId !== agent.id) return;

  if (value.phase === "active") {
    agent.status = "active";
  } else if (value.phase === "waiting" || value.phase === "done") {
    agent.status = "waiting";
  } else if (value.phase === "starting") {
    agent.status = "starting";
  } else {
    agent.status = "unknown";
  }
}

export function buildSnapshot(
  parentSessionId: string,
  agents: TrackedSubagent[],
  now: number,
): SubagentSnapshot {
  const uniqueSessionCosts = new Map<string, number>();
  let costsComplete = true;
  for (const agent of agents) {
    if (agent.cost === undefined) {
      costsComplete = false;
      continue;
    }
    uniqueSessionCosts.set(agent.sessionFile, agent.cost);
  }
  return {
    parentSessionId,
    agents,
    totalCost: Array.from(uniqueSessionCosts.values()).reduce((sum, cost) => sum + cost, 0),
    costsComplete,
    updatedAt: now,
  };
}
