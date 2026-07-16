import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import test from "node:test";
const base = new URL("../recipes/ghostty-tmux-fish/", import.meta.url);
test("recipe avoids hardcoded Homebrew paths and blind continue", async () => {
  for (const file of [
    "ghostty.conf",
    "tmux.conf",
    "config.fish",
    "isaac-preset.conf",
  ]) {
    const text = await readFile(new URL(file, base), "utf8");
    assert.doesNotMatch(text, /\/opt\/homebrew|--continue|—/);
  }
});
test("minimal terminal recipes contain the verified mouse, CSI-u, roles, and Ctrl+S setup", async () => {
  const ghostty = await readFile(new URL("ghostty.conf", base), "utf8");
  const tmux = await readFile(new URL("tmux.conf", base), "utf8");
  assert.match(ghostty, /mouse-reporting = true/);
  assert.match(ghostty, /mouse-shift-capture = never/);
  assert.doesNotMatch(ghostty, /ctrl\+s=text/);
  assert.match(tmux, /extended-keys-format csi-u/);
  assert.match(tmux, /bind -n C-s send-keys C-s/);
  assert.doesNotMatch(tmux, /set -g prefix|unbind C-b/);
  assert.match(tmux, /ORCHESTRATOR/);
  assert.match(tmux, /SUBAGENT/);
  assert.match(tmux, /SHELL/);
});
test("Fish recipe parses when Fish is available", async (t) => {
  try {
    execFileSync("fish", ["-n", new URL("config.fish", base).pathname]);
  } catch (error) {
    if (error.code === "ENOENT") t.skip("Fish unavailable");
    else throw error;
  }
});
test("tmux recipe parses on a private socket when tmux is available", async (t) => {
  const socket = `ptk-test-${process.pid}`;
  try {
    execFileSync("tmux", [
      "-L",
      socket,
      "-f",
      new URL("tmux.conf", base).pathname,
      "start-server",
    ]);
  } catch (error) {
    if (error.code === "ENOENT") t.skip("tmux unavailable");
    else throw error;
  } finally {
    try {
      execFileSync("tmux", ["-L", socket, "kill-server"]);
    } catch {}
  }
});
