import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
const root = new URL("..", import.meta.url).pathname;
for (const name of ["pi-codrive", "pi-fish-bridge", "pi-arcoiris-refined"]) {
  const cwd = join(root, "packages", name);
  const output = execFileSync("npm", ["pack", "--dry-run", "--json"], {
    cwd,
    encoding: "utf8",
  });
  const result = JSON.parse(output)[0];
  assert.equal(
    result.name,
    JSON.parse(readFileSync(join(cwd, "package.json"))).name,
  );
  assert.ok(result.files.some((file) => file.path === "README.md"));
  assert.ok(result.files.some((file) => file.path === "LICENSE"));
  assert.ok(!result.files.some((file) => file.path.includes("test/")));
}
console.log("npm pack dry-run content checks passed");
