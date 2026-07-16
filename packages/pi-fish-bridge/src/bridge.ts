import { execFile } from "node:child_process";
import { randomBytes } from "node:crypto";
import {
  chmod,
  lstat,
  mkdir,
  readdir,
  readFile,
  rename,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";

import { homedir } from "node:os";
import { basename, isAbsolute, join } from "node:path";
import { promisify } from "node:util";
const run = promisify(execFile);
export const VALID_NAME = /^[A-Za-z][A-Za-z0-9_-]*$/;
export interface FishBridgeConfig {
  fishPath: string | null;
  include: string[];
  exclude: string[];
  interactive: boolean;
}
export interface BridgeStatus {
  fish: string | null;
  cacheDir: string;
  names: string[];
  warning?: string;
}
export function paths(env = process.env) {
  const config = env.XDG_CONFIG_HOME || join(homedir(), ".config");
  const cache = env.XDG_CACHE_HOME || join(homedir(), ".cache");
  if (!isAbsolute(config) || !isAbsolute(cache))
    throw new Error("XDG paths must be absolute");
  return {
    configFile: join(config, "pi-fish-bridge", "config.json"),
    fishFunctions: join(config, "fish", "functions"),
    cacheDir: join(cache, "pi-fish-bridge", "shims"),
  };
}
export async function loadBridgeConfig(
  env = process.env,
): Promise<FishBridgeConfig> {
  const defaults: FishBridgeConfig = {
    fishPath: null,
    include: [],
    exclude: [],
    interactive: true,
  };
  try {
    const raw = JSON.parse(await readFile(paths(env).configFile, "utf8"));
    if (!raw || typeof raw !== "object")
      throw new Error("config must be an object");
    for (const key of ["include", "exclude"] as const)
      if (
        raw[key] !== undefined &&
        (!Array.isArray(raw[key]) ||
          raw[key].some(
            (n: unknown) => typeof n !== "string" || !VALID_NAME.test(n),
          ))
      )
        throw new Error(`${key} contains an invalid name`);
    if (raw.interactive !== undefined && typeof raw.interactive !== "boolean")
      throw new Error("interactive must be a boolean");
    if (
      raw.fishPath !== undefined &&
      raw.fishPath !== null &&
      (typeof raw.fishPath !== "string" || !isAbsolute(raw.fishPath))
    )
      throw new Error("fishPath must be absolute or null");
    return { ...defaults, ...raw };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return defaults;
    throw error;
  }
}
export async function findFish(
  config: FishBridgeConfig,
  env = process.env,
): Promise<string | null> {
  if (config.fishPath) {
    try {
      const info = await stat(config.fishPath);
      return info.isFile() ? config.fishPath : null;
    } catch {
      return null;
    }
  }
  for (const directory of (env.PATH || "").split(":")) {
    if (!directory) continue;
    const candidate = join(directory, "fish");
    try {
      const info = await stat(candidate);
      if (info.isFile() && info.mode & 0o111) return candidate;
    } catch {}
  }
  return null;
}
export async function discoverNames(
  functionDirectory: string,
): Promise<string[]> {
  const entries = await readdir(functionDirectory, {
    withFileTypes: true,
  }).catch(() => []);
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".fish"))
    .map((entry) => entry.name.slice(0, -5))
    .filter(safeName);
}
function safeName(name: string): boolean {
  return (
    VALID_NAME.test(name) && !name.startsWith("_") && !name.startsWith("fish")
  );
}
export function parseAbbreviations(output: string): Map<string, string> {
  const abbreviations = new Map<string, string>();
  for (const line of output.split("\n")) {
    const match = line.match(/^abbr -a -- ([A-Za-z][A-Za-z0-9_-]*) (.+)$/);
    if (!match || !safeName(match[1]!)) continue;
    const rawExpansion = match[2]!.trim();
    const expansion =
      rawExpansion.startsWith("'") && rawExpansion.endsWith("'")
        ? rawExpansion.slice(1, -1).replace(/\\'/g, "'")
        : rawExpansion;
    if (/(^|\s)(cd|exec|clear)(\s|$)/.test(expansion)) continue;
    abbreviations.set(match[1]!, expansion);
  }
  return abbreviations;
}
async function discoverAbbreviations(
  fish: string,
): Promise<Map<string, string>> {
  try {
    const { stdout } = await run(fish, ["-ic", "abbr --show"], {
      maxBuffer: 4 * 1024 * 1024,
    });
    return parseAbbreviations(stdout);
  } catch {
    return new Map();
  }
}
async function discoverInteractiveFunctions(fish: string): Promise<string[]> {
  try {
    const [configured, bare] = await Promise.all([
      run(fish, ["-ic", "functions -n"], { maxBuffer: 4 * 1024 * 1024 }),
      run(fish, ["--no-config", "-c", "functions -n"], {
        maxBuffer: 4 * 1024 * 1024,
      }),
    ]);
    const defaults = new Set(bare.stdout.split(/\s+/).filter(Boolean));
    return configured.stdout
      .split(/\s+/)
      .filter((name) => safeName(name) && !defaults.has(name));
  } catch {
    return [];
  }
}
export async function bashResolvable(
  names: string[],
  cacheDir: string,
  env = process.env,
): Promise<Set<string>> {
  if (!names.length) return new Set();
  const cleanPath = (env.PATH || "")
    .split(":")
    .filter((part) => part !== cacheDir)
    .join(":");
  const script =
    names
      .map(
        (name) =>
          `command -v -- '${name}' >/dev/null 2>&1 && printf '%s\\n' '${name}'`,
      )
      .join("\n") + "\ntrue";
  const { stdout } = await run("/bin/bash", ["-c", script], {
    env: { ...env, PATH: cleanPath },
  });
  return new Set(stdout.split("\n").filter(Boolean));
}
function quote(value: string): string {
  return `'${value.replace(/'/g, "'\\''")}'`;
}
export async function refresh(env = process.env): Promise<BridgeStatus> {
  const locations = paths(env);
  const config = await loadBridgeConfig(env);
  const fish = await findFish(config, env);
  if (!fish)
    return {
      fish: null,
      cacheDir: locations.cacheDir,
      names: [],
      warning: "fish was not found",
    };
  const discovered = new Map<string, string>();
  for (const name of await discoverNames(locations.fishFunctions))
    discovered.set(name, name);
  for (const name of await discoverInteractiveFunctions(fish))
    discovered.set(name, name);
  for (const [name, expansion] of await discoverAbbreviations(fish))
    if (!discovered.has(name)) discovered.set(name, expansion);
  for (const name of config.include) discovered.set(name, name);
  for (const name of config.exclude) discovered.delete(name);
  const resolvable = await bashResolvable(
    [...discovered.keys()],
    locations.cacheDir,
    env,
  );
  const names = [...discovered.keys()]
    .filter((name) => !resolvable.has(name))
    .sort();
  const parent = join(locations.cacheDir, "..");
  await mkdir(parent, { recursive: true, mode: 0o700 });
  const parentInfo = await lstat(parent);
  if (!parentInfo.isDirectory() || parentInfo.isSymbolicLink())
    throw new Error("unsafe cache parent");
  await chmod(parent, 0o700);
  try {
    const current = await lstat(locations.cacheDir);
    if (current.isSymbolicLink() || !current.isDirectory())
      throw new Error("unsafe cache target");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  const temporary = `${locations.cacheDir}.tmp-${randomBytes(8).toString("hex")}`;
  await mkdir(temporary, { mode: 0o700 });
  try {
    for (const name of names) {
      const target = join(temporary, name);
      const mode = config.interactive ? "-ic" : "-c";
      const invocation = discovered.get(name)!;
      const body = `#!/bin/sh\nexec ${quote(fish)} ${mode} ${quote(`${invocation} $argv`)} -- \"$@\"\n`;
      await writeFile(target, body, { mode: 0o700, flag: "wx" });
      await chmod(target, 0o700);
    }
    try {
      await rm(locations.cacheDir, { recursive: true });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
    await rename(temporary, locations.cacheDir);
    await chmod(locations.cacheDir, 0o700);
  } catch (error) {
    await rm(temporary, { recursive: true, force: true });
    throw error;
  }
  return { fish, cacheDir: locations.cacheDir, names };
}
