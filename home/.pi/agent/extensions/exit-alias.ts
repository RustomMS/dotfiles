import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

const EXIT_KEYWORDS = new Set(["exit", "quit"]);

export default function (pi: ExtensionAPI) {
  pi.on("input", async (event, ctx) => {
    if (EXIT_KEYWORDS.has(event.text.trim().toLowerCase())) {
      ctx.shutdown();
      return { action: "handled" };
    }
  });

  pi.registerCommand("exit", {
    description: "Quit pi (alias for /quit)",
    handler: async (_args, ctx) => {
      ctx.shutdown();
    },
  });
}
