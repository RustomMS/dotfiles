import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";

// Pi's mode is global. Set it to idle globally and suppress idle refreshes per session
// unless the user opts in; if this extension fails to load, Pi falls back to global idle.
const MODE_ENTRY = "builtin-cache-warming-mode";
const STATUS_ID = "cache-warming";
type SessionMode = "streaming" | "idle";

const sessionModes = new Map<string, SessionMode>();

export function restoreMode(ctx: ExtensionContext): SessionMode {
  const entries = ctx.sessionManager.getBranch();
  for (let i = entries.length - 1; i >= 0; i--) {
    const entry = entries[i];
    if (
      entry?.type === "custom" &&
      entry.customType === MODE_ENTRY &&
      typeof entry.data === "object" &&
      entry.data !== null &&
      "mode" in entry.data &&
      (entry.data.mode === "streaming" || entry.data.mode === "idle")
    ) {
      return entry.data.mode;
    }
  }
  return "streaming";
}

function getMode(ctx: ExtensionContext): SessionMode {
  return sessionModes.get(ctx.sessionManager.getSessionId()) ?? "streaming";
}

function updateStatus(ctx: ExtensionContext): void {
  const mode = getMode(ctx);
  ctx.ui.setStatus(STATUS_ID, `cache ${mode}`);
}

export default function builtinCacheWarmingToggle(pi: ExtensionAPI) {
  pi.on("session_start", (_event, ctx) => {
    sessionModes.set(ctx.sessionManager.getSessionId(), restoreMode(ctx));
    updateStatus(ctx);
  });

  // Persisted choices belong to a branch; navigating the tree can change the
  // latest choice without starting a new session.
  pi.on("session_tree", (_event, ctx) => {
    sessionModes.set(ctx.sessionManager.getSessionId(), restoreMode(ctx));
    updateStatus(ctx);
  });

  pi.registerCommand("cache-warming", {
    description: "Choose Pi cache warming mode for this session",
    handler: async (args, ctx) => {
      const action = args.trim().toLowerCase();
      if (action && action !== "streaming" && action !== "idle" && action !== "status") {
        ctx.ui.notify("Usage: /cache-warming [streaming|idle|status]", "warning");
        return;
      }

      const mode = action === "streaming"
        ? "streaming"
        : action === "idle"
          ? "idle"
          : action === "status"
            ? getMode(ctx)
            : getMode(ctx) === "streaming"
              ? "idle"
              : "streaming";
      if (action !== "status") {
        sessionModes.set(ctx.sessionManager.getSessionId(), mode);
        pi.appendEntry(MODE_ENTRY, { mode });
        updateStatus(ctx);
      }
      ctx.ui.notify(
        `Pi cache warming for this session: ${mode}. ${mode === "idle" ? "Idle refreshes are allowed; if warming already stopped, it resumes after the next model request." : "Idle refreshes are suppressed."}`,
        "info",
      );
    },
  });

  pi.on("cache_warming_decision", (_event, ctx) => {
    if (getMode(ctx) === "streaming" && ctx.isIdle()) {
      return { action: "stop" };
    }
  });

  pi.on("session_shutdown", (_event, ctx) => {
    sessionModes.delete(ctx.sessionManager.getSessionId());
    ctx.ui.setStatus(STATUS_ID, undefined);
  });
}
