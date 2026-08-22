import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const LONG_CACHE_MODEL = "claude-opus-5-long-cache";
const UPSTREAM_MODEL = "claude-opus-5";

type JsonObject = Record<string, unknown>;

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Set every Anthropic cache breakpoint to either the 5m or 1h TTL. */
function applyCacheRetention(value: unknown, retention: "short" | "long"): unknown {
  if (Array.isArray(value)) {
    return value.map((child) => applyCacheRetention(child, retention));
  }
  if (!isObject(value)) return value;

  const result = Object.fromEntries(
    Object.entries(value).map(([key, child]) => [
      key,
      applyCacheRetention(child, retention),
    ]),
  );

  if (isObject(result.cache_control) && result.cache_control.type === "ephemeral") {
    const { ttl: _ttl, ...cacheControl } = result.cache_control;
    result.cache_control =
      retention === "long" ? { ...cacheControl, ttl: "1h" } : cacheControl;
  }

  return result;
}

/**
 * models.json provides a selectable Opus 5 alias. For that alias, rewrite the
 * outgoing model ID to the real Anthropic model and upgrade cache markers to
 * the one-hour TTL. Regular claude-opus-5 requests retain the five-minute TTL.
 */
export default function (pi: ExtensionAPI) {
  pi.on("before_provider_request", (event, ctx) => {
    if (ctx.model?.provider !== "anthropic" || !isObject(event.payload)) return;

    if (ctx.model.id === LONG_CACHE_MODEL) {
      const payload = applyCacheRetention(event.payload, "long") as JsonObject;
      return { ...payload, model: UPSTREAM_MODEL };
    }

    if (ctx.model.id === UPSTREAM_MODEL) {
      return applyCacheRetention(event.payload, "short");
    }
  });
}
