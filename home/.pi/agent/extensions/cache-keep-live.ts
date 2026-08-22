import { readFileSync } from "node:fs";
import { join } from "node:path";
import type {
  CacheRetention,
  Context,
  Model,
  Tool,
  Usage,
} from "@earendil-works/pi-ai";
import {
  buildSessionContext,
  convertToLlm,
  getAgentDir,
  type ExtensionAPI,
  type ExtensionContext,
} from "@earendil-works/pi-coding-agent";

const CONFIG_FILE = "cache-keep-live.json";
const TOGGLE_ENTRY = "cache-keep-live-toggle";
const RESULT_ENTRY = "cache-keep-live-result";
const STATUS_ID = "cache-keep-live";
const OUTPUT_TOKENS = 16;

type JsonObject = Record<string, unknown>;
type Phase =
  | "off"
  | "warming"
  | "scheduled"
  | "active-request"
  | "refreshing"
  | "retrying"
  | "expired"
  | "budget"
  | "unsupported"
  | "failed";
type Classification = "hit" | "miss" | "unknown" | "failure";

interface PolicyInput {
  ttlMinutes?: number;
  maxKeepalives?: number;
  cacheRetention?: CacheRetention;
  upstreamModel?: string;
  minPromptTokens?: number;
}

interface ProviderConfig {
  minPromptTokens?: number;
  defaults?: PolicyInput;
  models?: Record<string, PolicyInput>;
}

interface Config {
  jitterPercent: { min: number; max: number };
  retry: {
    maxAttempts: number;
    backoffSeconds: { min: number; max: number };
  };
  providers: Record<string, ProviderConfig>;
}

interface Policy {
  ttlMs: number;
  maxKeepalives: number;
  cacheRetention: CacheRetention;
  upstreamModel?: string;
  minPromptTokens: number;
  label: string;
}

interface KeepaliveResultData {
  modelKey: string;
  classification: Classification;
  touchAt?: number;
  usage?: Usage;
}

interface Metrics {
  hits: number;
  misses: number;
  unknown: number;
  failures: number;
  usage: Usage;
}

const DEFAULT_CONFIG: Config = {
  jitterPercent: { min: 0.85, max: 0.92 },
  retry: {
    maxAttempts: 2,
    backoffSeconds: { min: 3, max: 7 },
  },
  providers: {
    anthropic: {
      minPromptTokens: 4096,
      defaults: {
        ttlMinutes: 5,
        maxKeepalives: 9,
        cacheRetention: "short",
      },
      models: {
        "claude-opus-5-long-cache": {
          ttlMinutes: 60,
          maxKeepalives: 9,
          cacheRetention: "long",
          upstreamModel: "claude-opus-5",
        },
      },
    },
    "openai-codex": {
      minPromptTokens: 1024,
      models: {
        "gpt-5.6-*": {
          ttlMinutes: 30,
          maxKeepalives: 5,
          cacheRetention: "short",
        },
      },
    },
  },
};

function emptyUsage(): Usage {
  return {
    input: 0,
    output: 0,
    cacheRead: 0,
    cacheWrite: 0,
    totalTokens: 0,
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
  };
}

function emptyMetrics(): Metrics {
  return { hits: 0, misses: 0, unknown: 0, failures: 0, usage: emptyUsage() };
}

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function positiveNumber(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    throw new Error(`${label} must be a positive number`);
  }
  return value;
}

function positiveInteger(value: unknown, label: string): number {
  const number = positiveNumber(value, label);
  if (!Number.isInteger(number)) throw new Error(`${label} must be an integer`);
  return number;
}

function parsePolicy(value: unknown, label: string): PolicyInput {
  if (!isObject(value)) throw new Error(`${label} must be an object`);
  const result: PolicyInput = {};
  if (value.ttlMinutes !== undefined) {
    result.ttlMinutes = positiveNumber(value.ttlMinutes, `${label}.ttlMinutes`);
  }
  if (value.maxKeepalives !== undefined) {
    result.maxKeepalives = positiveInteger(
      value.maxKeepalives,
      `${label}.maxKeepalives`,
    );
  }
  if (value.minPromptTokens !== undefined) {
    result.minPromptTokens = positiveInteger(
      value.minPromptTokens,
      `${label}.minPromptTokens`,
    );
  }
  if (value.cacheRetention !== undefined) {
    if (!new Set(["none", "short", "long"]).has(String(value.cacheRetention))) {
      throw new Error(`${label}.cacheRetention must be none, short, or long`);
    }
    result.cacheRetention = value.cacheRetention as CacheRetention;
  }
  if (value.upstreamModel !== undefined) {
    if (typeof value.upstreamModel !== "string" || !value.upstreamModel.trim()) {
      throw new Error(`${label}.upstreamModel must be a non-empty string`);
    }
    result.upstreamModel = value.upstreamModel;
  }
  return result;
}

function parseConfig(value: unknown): Config {
  if (!isObject(value)) throw new Error("config must be an object");

  const jitter = isObject(value.jitterPercent)
    ? value.jitterPercent
    : DEFAULT_CONFIG.jitterPercent;
  const jitterMin = positiveNumber(jitter.min, "jitterPercent.min");
  const jitterMax = positiveNumber(jitter.max, "jitterPercent.max");
  if (jitterMin > jitterMax || jitterMax >= 1) {
    throw new Error("jitterPercent must satisfy 0 < min <= max < 1");
  }

  const retry = isObject(value.retry) ? value.retry : DEFAULT_CONFIG.retry;
  const backoff = isObject(retry.backoffSeconds)
    ? retry.backoffSeconds
    : DEFAULT_CONFIG.retry.backoffSeconds;
  const backoffMin = positiveNumber(backoff.min, "retry.backoffSeconds.min");
  const backoffMax = positiveNumber(backoff.max, "retry.backoffSeconds.max");
  if (backoffMin > backoffMax) {
    throw new Error("retry backoff min must not exceed max");
  }

  const providerValues = isObject(value.providers)
    ? value.providers
    : DEFAULT_CONFIG.providers;
  const providers: Record<string, ProviderConfig> = {};
  for (const [providerId, rawProvider] of Object.entries(providerValues)) {
    if (!isObject(rawProvider)) throw new Error(`providers.${providerId} must be an object`);
    const provider: ProviderConfig = {};
    if (rawProvider.minPromptTokens !== undefined) {
      provider.minPromptTokens = positiveInteger(
        rawProvider.minPromptTokens,
        `providers.${providerId}.minPromptTokens`,
      );
    }
    if (rawProvider.defaults !== undefined) {
      provider.defaults = parsePolicy(
        rawProvider.defaults,
        `providers.${providerId}.defaults`,
      );
    }
    if (rawProvider.models !== undefined) {
      if (!isObject(rawProvider.models)) {
        throw new Error(`providers.${providerId}.models must be an object`);
      }
      provider.models = Object.fromEntries(
        Object.entries(rawProvider.models).map(([pattern, policy]) => [
          pattern,
          parsePolicy(policy, `providers.${providerId}.models.${pattern}`),
        ]),
      );
    }
    providers[providerId] = provider;
  }

  return {
    jitterPercent: { min: jitterMin, max: jitterMax },
    retry: {
      maxAttempts: positiveInteger(retry.maxAttempts, "retry.maxAttempts"),
      backoffSeconds: { min: backoffMin, max: backoffMax },
    },
    providers,
  };
}

function loadConfig(): { config: Config; error?: string } {
  const path = join(getAgentDir(), CONFIG_FILE);
  try {
    return { config: parseConfig(JSON.parse(readFileSync(path, "utf8"))) };
  } catch (error) {
    return {
      config: DEFAULT_CONFIG,
      error: `${path}: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

function globMatches(pattern: string, value: string): boolean {
  const expression = pattern
    .split("*")
    .map((part) => part.replace(/[|\\{}()[\]^$+?.]/g, "\\$&"))
    .join(".*");
  return new RegExp(`^${expression}$`, "u").test(value);
}

function resolvePolicy(config: Config, model: Model<any> | undefined): Policy | undefined {
  if (!model) return undefined;
  const provider = config.providers[model.provider];
  if (!provider) return undefined;

  const models = provider.models ?? {};
  const exact = models[model.id];
  const glob = exact
    ? undefined
    : Object.entries(models)
        .filter(([pattern]) => pattern.includes("*") && globMatches(pattern, model.id))
        .sort(([left], [right]) => right.length - left.length)[0]?.[1];
  const merged = { ...(provider.defaults ?? {}), ...(exact ?? glob ?? {}) };
  if (
    merged.ttlMinutes === undefined ||
    merged.maxKeepalives === undefined ||
    merged.cacheRetention === undefined
  ) {
    return undefined;
  }

  return {
    ttlMs: merged.ttlMinutes * 60_000,
    maxKeepalives: merged.maxKeepalives,
    cacheRetention: merged.cacheRetention,
    upstreamModel: merged.upstreamModel,
    minPromptTokens: merged.minPromptTokens ?? provider.minPromptTokens ?? 1,
    label:
      model.provider === "openai-codex"
        ? "codex"
        : merged.cacheRetention === "long"
          ? "long"
          : "short",
  };
}

function modelKey(model: Model<any> | undefined): string | undefined {
  return model ? `${model.provider}/${model.id}` : undefined;
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function formatDuration(ms: number): string {
  const seconds = Math.max(0, Math.ceil(ms / 1000));
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m${String(seconds % 60).padStart(2, "0")}s`;
}

function formatTokens(tokens: number): string {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`;
  if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(1)}K`;
  return String(tokens);
}

function incrementMetric(metrics: Metrics, classification: Classification): void {
  if (classification === "hit") metrics.hits++;
  else if (classification === "miss") metrics.misses++;
  else if (classification === "unknown") metrics.unknown++;
  else metrics.failures++;
}

function addUsage(target: Usage, usage: Usage): void {
  target.input += usage.input;
  target.output += usage.output;
  target.cacheRead += usage.cacheRead;
  target.cacheWrite += usage.cacheWrite;
  target.cacheWrite1h = (target.cacheWrite1h ?? 0) + (usage.cacheWrite1h ?? 0);
  target.totalTokens += usage.totalTokens;
  target.cost.input += usage.cost.input;
  target.cost.output += usage.cost.output;
  target.cost.cacheRead += usage.cost.cacheRead;
  target.cost.cacheWrite += usage.cost.cacheWrite;
  target.cost.total += usage.cost.total;
}

function classify(usage: Usage, minPromptTokens: number): Classification {
  if (usage.cacheRead > 0) return "hit";
  if (usage.cacheWrite > 0 || usage.input >= minPromptTokens) return "miss";
  return "unknown";
}

function isKeepaliveResultData(value: unknown): value is KeepaliveResultData {
  return (
    isObject(value) &&
    typeof value.modelKey === "string" &&
    new Set(["hit", "miss", "unknown", "failure"]).has(String(value.classification))
  );
}

function activeTools(pi: ExtensionAPI): Tool[] | undefined {
  const active = new Set(pi.getActiveTools());
  const tools = pi
    .getAllTools()
    .filter((tool) => active.has(tool.name))
    .map((tool) => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    })) as Tool[];
  return tools.length > 0 ? tools : undefined;
}

function estimateContextTokens(context: Context, ctx: ExtensionContext): number {
  const measured = ctx.getContextUsage()?.tokens;
  if (measured && measured > 0) return measured;
  return Math.ceil(JSON.stringify(context).length / 4);
}

function abortableDelay(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    const abort = () => {
      clearTimeout(timer);
      reject(new DOMException("Aborted", "AbortError"));
    };
    if (signal.aborted) abort();
    else signal.addEventListener("abort", abort, { once: true });
  });
}

export default function cacheKeepLiveExtension(pi: ExtensionAPI) {
  const loaded = loadConfig();
  const config = loaded.config;

  let ctx: ExtensionContext | undefined;
  let enabled = false;
  let phase: Phase = "off";
  let snapshot: Context | undefined;
  let snapshotTokens = 0;
  let selectedModel: Model<any> | undefined;
  let policy: Policy | undefined;
  let selectedModelKey: string | undefined;
  let lastTouchAt: number | undefined;
  let nextAt: number | undefined;
  let deadlineAt: number | undefined;
  let streakKeepalives = 0;
  let metrics = emptyMetrics();
  let normalRequestInFlight = false;
  let pendingRealRequestAt: number | undefined;
  let pendingRealModelKey: string | undefined;
  let scheduleTimer: ReturnType<typeof setTimeout> | undefined;
  let statusTimer: ReturnType<typeof setInterval> | undefined;
  let keepaliveController: AbortController | undefined;
  let failureNotified = false;

  function clearSchedule(): void {
    if (scheduleTimer) clearTimeout(scheduleTimer);
    scheduleTimer = undefined;
    nextAt = undefined;
    deadlineAt = undefined;
  }

  function abortKeepalive(): void {
    keepaliveController?.abort();
    keepaliveController = undefined;
  }

  function updateStatus(): void {
    if (!ctx) return;
    if (!enabled || phase === "off") {
      ctx.ui.setStatus(STATUS_ID, undefined);
      return;
    }

    let text: string;
    switch (phase) {
      case "scheduled":
        text = `cache ${formatDuration((nextAt ?? Date.now()) - Date.now())}`;
        break;
      case "active-request":
        text = "cache active";
        break;
      case "refreshing":
        text = "cache refreshing";
        break;
      case "retrying":
        text = "cache retrying";
        break;
      case "budget":
        text = "cache stopped";
        break;
      case "expired":
        text = "cache expired";
        break;
      case "unsupported":
        text = "cache unsupported";
        break;
      case "failed":
        text = "cache failed";
        break;
      default:
        text = "cache warming";
        break;
    }
    ctx.ui.setStatus(STATUS_ID, text);
  }

  function captureContext(eventMessages?: Parameters<typeof convertToLlm>[0]): void {
    if (!ctx) return;
    const messages =
      eventMessages ??
      buildSessionContext(
        ctx.sessionManager.getEntries(),
        ctx.sessionManager.getLeafId(),
      ).messages;
    snapshot = {
      systemPrompt: ctx.getSystemPrompt(),
      messages: convertToLlm(messages),
      tools: activeTools(pi),
    };
    snapshotTokens = estimateContextTokens(snapshot, ctx);
  }

  function scanSessionState(): void {
    if (!ctx) return;
    let latestToggle: boolean | undefined;
    metrics = emptyMetrics();
    lastTouchAt = undefined;
    streakKeepalives = 0;

    const results: Array<{ timestamp: number; data: KeepaliveResultData }> = [];
    let latestRealTouch = 0;
    for (const entry of ctx.sessionManager.getEntries()) {
      if (entry.type === "custom" && entry.customType === TOGGLE_ENTRY) {
        if (isObject(entry.data) && typeof entry.data.enabled === "boolean") {
          latestToggle = entry.data.enabled;
        }
      }
      if (entry.type === "custom" && entry.customType === RESULT_ENTRY) {
        if (!isKeepaliveResultData(entry.data)) continue;
        const timestamp = new Date(entry.timestamp).getTime();
        results.push({ timestamp, data: entry.data });
        incrementMetric(metrics, entry.data.classification);
        if (entry.data.usage) addUsage(metrics.usage, entry.data.usage);
      }
      if (
        entry.type === "message" &&
        entry.message.role === "assistant" &&
        selectedModelKey === `${entry.message.provider}/${entry.message.model}` &&
        entry.message.stopReason !== "error" &&
        entry.message.stopReason !== "aborted"
      ) {
        latestRealTouch = Math.max(latestRealTouch, entry.message.timestamp);
      }
    }

    enabled = latestToggle ?? false;
    lastTouchAt = latestRealTouch || undefined;
    for (const result of results) {
      if (result.data.modelKey !== selectedModelKey || result.data.classification === "failure") {
        continue;
      }
      if ((result.data.touchAt ?? result.timestamp) > latestRealTouch) streakKeepalives++;
      if (result.data.touchAt) {
        lastTouchAt = Math.max(lastTouchAt ?? 0, result.data.touchAt);
      }
    }
  }

  function setSelection(model: Model<any> | undefined): void {
    selectedModel = model;
    selectedModelKey = modelKey(model);
    policy = resolvePolicy(config, model);
  }

  function armFromTouch(): void {
    clearSchedule();
    if (!ctx || !enabled) {
      phase = "off";
      updateStatus();
      return;
    }
    if (!policy) {
      phase = "unsupported";
      updateStatus();
      return;
    }
    if (!snapshot || snapshotTokens < policy.minPromptTokens || !lastTouchAt) {
      phase = "warming";
      updateStatus();
      return;
    }
    if (streakKeepalives >= policy.maxKeepalives) {
      phase = "budget";
      updateStatus();
      return;
    }

    deadlineAt = lastTouchAt + policy.ttlMs;
    if (Date.now() >= deadlineAt) {
      phase = "expired";
      updateStatus();
      return;
    }

    const jitter = randomBetween(config.jitterPercent.min, config.jitterPercent.max);
    nextAt = lastTouchAt + policy.ttlMs * jitter;
    phase = "scheduled";
    const delay = Math.max(0, nextAt - Date.now());
    scheduleTimer = setTimeout(() => void runKeepalive(), delay);
    scheduleTimer.unref?.();
    updateStatus();
  }

  function persistResult(
    classification: Classification,
    usage?: Usage,
    touchAt?: number,
  ): void {
    if (!selectedModelKey) return;
    pi.appendEntry(RESULT_ENTRY, {
      modelKey: selectedModelKey,
      classification,
      touchAt,
      usage,
    } satisfies KeepaliveResultData);
    incrementMetric(metrics, classification);
    if (usage) addUsage(metrics.usage, usage);
  }

  async function runKeepalive(): Promise<void> {
    scheduleTimer = undefined;
    if (!ctx || !enabled || !policy || !selectedModel || !snapshot || !selectedModelKey) {
      armFromTouch();
      return;
    }
    if (normalRequestInFlight) {
      phase = "active-request";
      updateStatus();
      return;
    }
    if (!deadlineAt || Date.now() >= deadlineAt) {
      phase = "expired";
      updateStatus();
      return;
    }
    if (streakKeepalives >= policy.maxKeepalives) {
      phase = "budget";
      updateStatus();
      return;
    }

    const requestModel = policy.upstreamModel
      ? ctx.modelRegistry.find(selectedModel.provider, policy.upstreamModel)
      : selectedModel;
    if (!requestModel) {
      phase = "unsupported";
      updateStatus();
      return;
    }

    const controller = new AbortController();
    keepaliveController = controller;
    let lastError: unknown;

    try {
      for (let attempt = 1; attempt <= config.retry.maxAttempts; attempt++) {
        if (controller.signal.aborted) return;
        const attemptStart = Date.now();
        if (attemptStart >= deadlineAt) {
          phase = "expired";
          updateStatus();
          return;
        }

        phase = attempt === 1 ? "refreshing" : "retrying";
        updateStatus();
        const remaining = deadlineAt - attemptStart;
        const timeoutMs = Math.max(3_000, Math.min(15_000, remaining - 8_000));

        try {
          const response = await ctx.modelRegistry.complete(requestModel, snapshot, {
            signal: controller.signal,
            sessionId: ctx.sessionManager.getSessionId(),
            cacheRetention: policy.cacheRetention,
            maxTokens: OUTPUT_TOKENS,
            maxRetries: 0,
            timeoutMs,
            thinkingEnabled: false,
            reasoningEffort: "none",
          } as any);
          if (response.stopReason === "error" || response.stopReason === "aborted") {
            throw new Error(response.errorMessage ?? `keepalive ${response.stopReason}`);
          }

          const classification = classify(response.usage, policy.minPromptTokens);
          persistResult(classification, response.usage, attemptStart);
          streakKeepalives++;
          lastTouchAt = attemptStart;
          if (streakKeepalives >= policy.maxKeepalives) {
            clearSchedule();
            phase = "budget";
            updateStatus();
          } else {
            armFromTouch();
          }
          return;
        } catch (error) {
          if (controller.signal.aborted) return;
          lastError = error;
          if (attempt >= config.retry.maxAttempts) break;
          const backoffMs =
            randomBetween(
              config.retry.backoffSeconds.min,
              config.retry.backoffSeconds.max,
            ) * 1000;
          if (Date.now() + backoffMs + 2_000 >= deadlineAt) break;
          phase = "retrying";
          updateStatus();
          await abortableDelay(backoffMs, controller.signal);
        }
      }

      persistResult("failure");
      phase = Date.now() >= deadlineAt ? "expired" : "failed";
      updateStatus();
      if (!failureNotified) {
        failureNotified = true;
        ctx.ui.notify(
          `Cache keep-live failed: ${lastError instanceof Error ? lastError.message : String(lastError)}`,
          "warning",
        );
      }
    } finally {
      if (keepaliveController === controller) keepaliveController = undefined;
    }
  }

  function restoreAfterFailedRealRequest(): void {
    normalRequestInFlight = false;
    pendingRealRequestAt = undefined;
    pendingRealModelKey = undefined;
    armFromTouch();
  }

  function statusText(): string {
    const total = metrics.hits + metrics.misses + metrics.unknown;
    const lines = [
      `Cache keep-live: ${enabled ? phase : "off"}`,
      `Model: ${selectedModelKey ?? "none"}`,
    ];
    if (policy) {
      lines.push(
        `Retention: ${policy.label} (${formatDuration(policy.ttlMs)})`,
        `Current streak: ${streakKeepalives}/${policy.maxKeepalives}`,
      );
    }
    if (phase === "scheduled" && nextAt) {
      lines.push(`Next refresh: ${formatDuration(nextAt - Date.now())}`);
    }
    lines.push(
      `Session: ${total} completed (${metrics.hits} hits, ${metrics.misses} misses, ${metrics.unknown} unknown), ${metrics.failures} failed`,
      `Usage: ${formatTokens(metrics.usage.cacheRead)} cache-read, ${formatTokens(metrics.usage.cacheWrite)} cache-write, ${formatTokens(metrics.usage.output)} output, $${metrics.usage.cost.total.toFixed(3)}`,
    );
    return lines.join("\n");
  }

  pi.registerCommand("cache-keep-live", {
    description: "Toggle or inspect prompt-cache keep-live mode",
    handler: async (args, commandCtx) => {
      ctx = commandCtx;
      const action = args.trim().toLowerCase();
      if (action === "status") {
        commandCtx.ui.notify(statusText(), "info");
        return;
      }
      if (action && action !== "on" && action !== "off") {
        commandCtx.ui.notify("Usage: /cache-keep-live [on|off|status]", "warning");
        return;
      }

      const nextEnabled = action === "on" ? true : action === "off" ? false : !enabled;
      if (nextEnabled === enabled) {
        commandCtx.ui.notify(`Cache keep-live is already ${enabled ? "on" : "off"}`, "info");
        return;
      }

      enabled = nextEnabled;
      pi.appendEntry(TOGGLE_ENTRY, { enabled });
      if (enabled) {
        captureContext();
        armFromTouch();
      } else {
        abortKeepalive();
        clearSchedule();
        phase = "off";
        updateStatus();
      }
      commandCtx.ui.notify(`Cache keep-live ${enabled ? "enabled" : "disabled"}`, "info");
    },
  });

  pi.on("session_start", (_event, sessionCtx) => {
    ctx = sessionCtx;
    setSelection(sessionCtx.model);
    captureContext();
    scanSessionState();
    armFromTouch();

    if (loaded.error) {
      sessionCtx.ui.notify(
        `Invalid ${CONFIG_FILE}; using built-in defaults: ${loaded.error}`,
        "warning",
      );
    }

    statusTimer = setInterval(updateStatus, 1_000);
    statusTimer.unref?.();
  });

  pi.on("context", (event, eventCtx) => {
    ctx = eventCtx;
    abortKeepalive();
    captureContext(event.messages);
  });

  pi.on("before_provider_request", (_event, eventCtx) => {
    ctx = eventCtx;
    abortKeepalive();
    normalRequestInFlight = true;
    pendingRealRequestAt = Date.now();
    pendingRealModelKey = modelKey(eventCtx.model);
    clearSchedule();
    if (enabled) phase = "active-request";
    updateStatus();
  });

  pi.on("message_end", (event, eventCtx) => {
    if (event.message.role !== "assistant" || !normalRequestInFlight) return;
    ctx = eventCtx;
    if (
      event.message.stopReason === "error" ||
      event.message.stopReason === "aborted" ||
      pendingRealModelKey !== selectedModelKey
    ) {
      restoreAfterFailedRealRequest();
      return;
    }

    normalRequestInFlight = false;
    streakKeepalives = 0;
    lastTouchAt = pendingRealRequestAt ?? event.message.timestamp;
    pendingRealRequestAt = undefined;
    pendingRealModelKey = undefined;
    armFromTouch();
  });

  pi.on("agent_end", (_event, eventCtx) => {
    ctx = eventCtx;
    if (normalRequestInFlight) restoreAfterFailedRealRequest();
  });

  pi.on("model_select", (event, eventCtx) => {
    ctx = eventCtx;
    abortKeepalive();
    clearSchedule();
    normalRequestInFlight = false;
    pendingRealRequestAt = undefined;
    pendingRealModelKey = undefined;
    setSelection(event.model);
    captureContext();
    scanSessionState();
    armFromTouch();
  });

  const resetAfterContextChange = (eventCtx: ExtensionContext) => {
    ctx = eventCtx;
    abortKeepalive();
    clearSchedule();
    normalRequestInFlight = false;
    pendingRealRequestAt = undefined;
    pendingRealModelKey = undefined;
    lastTouchAt = undefined;
    streakKeepalives = 0;
    captureContext();
    phase = enabled ? "warming" : "off";
    updateStatus();
  };

  pi.on("session_compact", (_event, eventCtx) => resetAfterContextChange(eventCtx));
  pi.on("session_tree", (_event, eventCtx) => resetAfterContextChange(eventCtx));

  pi.on("session_shutdown", () => {
    abortKeepalive();
    clearSchedule();
    if (statusTimer) clearInterval(statusTimer);
    statusTimer = undefined;
    ctx?.ui.setStatus(STATUS_ID, undefined);
    ctx = undefined;
  });
}
