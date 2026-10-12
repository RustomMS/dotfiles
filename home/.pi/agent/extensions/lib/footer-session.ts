// Adapts an extension's ctx/pi into the slice of AgentSession that Pi's built-in
// FooterComponent reads, so a custom footer can wrap it instead of re-implementing it.
// Fields mirror what dist/modes/interactive/components/footer.js touches; the contract
// test in plugin-tests/footer-session.test.ts renders the real component to catch drift.

interface ProviderLike { auth?: { oauth?: { isSubscription?: boolean } } }

interface CtxLike {
  model: unknown;
  sessionManager: {
    getEntries(): readonly unknown[];
    getSessionId(): string;
    getLeafId(): string | null;
    getCwd(): string;
    getSessionName(): string | undefined;
    getEntryCount?(): number;
  };
  modelRegistry: {
    isUsingOAuth(model: never): boolean;
    getProvider(provider: string): ProviderLike | undefined;
  };
  getContextUsage(): unknown;
}

interface PiLike {
  getThinkingLevel(): string;
}

export function createFooterSession(ctx: CtxLike, pi: PiLike) {
  return {
    // Explicit delegation: getEntryCount is missing from the extension-facing type but
    // present at runtime, and it keeps the built-in stats cache key cheap.
    sessionManager: {
      getEntries: () => ctx.sessionManager.getEntries(),
      getEntryCount: () =>
        ctx.sessionManager.getEntryCount?.() ?? ctx.sessionManager.getEntries().length,
      getSessionId: () => ctx.sessionManager.getSessionId(),
      getLeafId: () => ctx.sessionManager.getLeafId(),
      getCwd: () => ctx.sessionManager.getCwd(),
      getSessionName: () => ctx.sessionManager.getSessionName(),
    },
    get state() {
      return { model: ctx.model, thinkingLevel: pi.getThinkingLevel() };
    },
    get model() {
      return ctx.model;
    },
    // Virtual-model routing is not exposed to extensions.
    routedModel: undefined,
    getContextUsage: () => ctx.getContextUsage(),
    modelRuntime: {
      // Mirrors ModelRuntime.isUsingSubscription: OAuth login on a subscription provider.
      isUsingSubscription: (provider: string) =>
        ctx.modelRegistry.isUsingOAuth({ provider } as never) &&
        ctx.modelRegistry.getProvider(provider)?.auth?.oauth?.isSubscription === true,
    },
  };
}
