import {
  createLocalBashOperations,
  type ExtensionAPI,
} from "@earendil-works/pi-coding-agent";
import { paths, refresh, type BridgeStatus } from "../src/bridge.ts";
export default function fishBridge(pi: ExtensionAPI): void {
  let status: BridgeStatus | undefined;
  const update = async () => {
    status = await refresh();
    return status;
  };
  pi.on("session_start", async (_event, ctx) => {
    try {
      await update();
    } catch (error) {
      ctx.ui.notify(
        `fish bridge refresh failed: ${(error as Error).message}`,
        "warning",
      );
    }
  });
  pi.on("user_bash", () => {
    const local = createLocalBashOperations();
    const cache = paths().cacheDir;
    return {
      operations: {
        exec(command, cwd, options) {
          return local.exec(
            `PATH=${shellQuote(cache)}:$PATH\n${command}`,
            cwd,
            options,
          );
        },
      },
    };
  });
  pi.registerCommand("fish-bridge-refresh", {
    description: "Rebuild Fish command shims safely",
    handler: async (_args, ctx) => {
      try {
        const next = await update();
        ctx.ui.notify(
          `Fish bridge: ${next.names.length} shims in ${next.cacheDir}`,
          next.fish ? "info" : "warning",
        );
      } catch (error) {
        ctx.ui.notify((error as Error).message, "error");
      }
    },
  });
  pi.registerCommand("fish-bridge-status", {
    description: "Show Fish bridge discovery and cache status",
    handler: async (_args, ctx) => {
      const current = status ?? (await update());
      ctx.ui.notify(
        `${current.fish ?? "Fish not found"}; ${current.names.length} shims; ${current.cacheDir}${current.warning ? `; ${current.warning}` : ""}`,
        current.fish ? "info" : "warning",
      );
    },
  });
}
function shellQuote(value: string): string {
  return `'${value.replace(/'/g, "'\\''")}'`;
}
