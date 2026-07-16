import assert from "node:assert/strict";
import test from "node:test";
import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  discoverNames,
  findFish,
  loadBridgeConfig,
  parseAbbreviations,
  paths,
  refresh,
  VALID_NAME,
} from "../src/bridge.ts";
function fixture() {
  const root = mkdtempSync(join(tmpdir(), "fish-bridge-test-"));
  const config = join(root, "config");
  const cache = join(root, "cache");
  const bin = join(root, "bin");
  mkdirSync(join(config, "fish", "functions"), { recursive: true });
  mkdirSync(bin);
  const fish = join(bin, "fish");
  writeFileSync(fish, "#!/bin/sh\nexit 0\n");
  chmodSync(fish, 0o755);
  return {
    root,
    config,
    cache,
    bin,
    fish,
    env: {
      ...process.env,
      HOME: root,
      XDG_CONFIG_HOME: config,
      XDG_CACHE_HOME: cache,
      PATH: `${bin}:/usr/bin:/bin`,
    },
  };
}
test("strict names", () => {
  assert.equal(VALID_NAME.test("gs-safe_2"), true);
  for (const name of ["../x", "2bad", "bad name", "a/b"])
    assert.equal(VALID_NAME.test(name), false);
});
test("simple abbreviations parse while unsafe expansions are skipped", () => {
  const parsed = parseAbbreviations(
    "abbr -a -- lg lazygit\nabbr -a -- nope 'cd /tmp'\nabbr --regex x y",
  );
  assert.equal(parsed.get("lg"), "lazygit");
  assert.equal(parsed.has("nope"), false);
});
test("Fish discovery uses config then PATH and reports no Fish", async () => {
  const f = fixture();
  assert.equal(
    await findFish(
      { fishPath: null, include: [], exclude: [], interactive: true },
      f.env,
    ),
    f.fish,
  );
  assert.equal(
    await findFish(
      { fishPath: null, include: [], exclude: [], interactive: true },
      { ...f.env, PATH: "/nonexistent" },
    ),
    null,
  );
});
test("function parsing excludes invalid and reserved names", async () => {
  const f = fixture();
  const dir = join(f.config, "fish", "functions");
  for (const name of [
    "good.fish",
    "_private.fish",
    "fish_bad.fish",
    "bad name.fish",
  ])
    writeFileSync(join(dir, name), "");
  assert.deepEqual(await discoverNames(dir), ["good"]);
});
test("refresh writes isolated atomic mode-0700 shims and does not shadow Bash", async () => {
  const f = fixture();
  const dir = join(f.config, "fish", "functions");
  writeFileSync(join(dir, "mycmd.fish"), "");
  writeFileSync(join(dir, "cd.fish"), "");
  const result = await refresh(f.env);
  assert.deepEqual(result.names, ["mycmd"]);
  assert.equal(statSync(result.cacheDir).mode & 0o077, 0);
  assert.equal(statSync(join(result.cacheDir, "mycmd")).mode & 0o077, 0);
  assert.match(
    readFileSync(join(result.cacheDir, "mycmd"), "utf8"),
    /fish.*-ic/,
  );
});
test("symlink cache target is rejected", async () => {
  const f = fixture();
  const cache = paths(f.env).cacheDir;
  mkdirSync(join(cache, ".."), { recursive: true });
  symlinkSync(f.root, cache);
  writeFileSync(join(f.config, "fish", "functions", "mycmd.fish"), "");
  await assert.rejects(refresh(f.env), /unsafe cache target/);
});
test("config validates names and strict booleans", async () => {
  const f = fixture();
  mkdirSync(join(f.config, "pi-fish-bridge"), { recursive: true });
  const configFile = join(f.config, "pi-fish-bridge", "config.json");
  writeFileSync(configFile, JSON.stringify({ include: ["bad name"] }));
  await assert.rejects(loadBridgeConfig(f.env));
  writeFileSync(configFile, JSON.stringify({ interactive: "false" }));
  await assert.rejects(loadBridgeConfig(f.env), /boolean/);
});
