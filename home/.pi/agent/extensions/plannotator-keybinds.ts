import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export default function (pi: ExtensionAPI) {
  pi.registerShortcut("ctrl+super+r", {
    description: "Open Plannotator review",
    handler: async (ctx) => {
      if (!ctx.hasUI) return;
      await pi.sendUserMessage("/plannotator-review", {
        deliverAs: "followUp",
        expandPromptTemplates: true,
      });
    },
  });

  pi.registerShortcut("ctrl+super+l", {
    description: "Open Plannotator last-message review",
    handler: async (ctx) => {
      if (!ctx.hasUI) return;
      await pi.sendUserMessage("/plannotator-last", {
        deliverAs: "followUp",
        expandPromptTemplates: true,
      });
    },
  });
}
