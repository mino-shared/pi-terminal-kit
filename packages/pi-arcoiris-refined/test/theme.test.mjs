import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
const theme = JSON.parse(
  await readFile(new URL("../themes/arcoiris-refined.json", import.meta.url)),
);
const required = [
  "accent",
  "border",
  "borderAccent",
  "borderMuted",
  "success",
  "error",
  "warning",
  "muted",
  "dim",
  "text",
  "thinkingText",
  "selectedBg",
  "userMessageBg",
  "userMessageText",
  "customMessageBg",
  "customMessageText",
  "customMessageLabel",
  "toolPendingBg",
  "toolSuccessBg",
  "toolErrorBg",
  "toolTitle",
  "toolOutput",
  "mdHeading",
  "mdLink",
  "mdLinkUrl",
  "mdCode",
  "mdCodeBlock",
  "mdCodeBlockBorder",
  "mdQuote",
  "mdQuoteBorder",
  "mdHr",
  "mdListBullet",
  "toolDiffAdded",
  "toolDiffRemoved",
  "toolDiffContext",
  "syntaxComment",
  "syntaxKeyword",
  "syntaxFunction",
  "syntaxVariable",
  "syntaxString",
  "syntaxNumber",
  "syntaxType",
  "syntaxOperator",
  "syntaxPunctuation",
  "thinkingOff",
  "thinkingMinimal",
  "thinkingLow",
  "thinkingMedium",
  "thinkingHigh",
  "thinkingXhigh",
  "bashMode",
];
function resolve(value) {
  return typeof value === "string" && value in theme.vars
    ? theme.vars[value]
    : value;
}
function rgb(hex) {
  return [1, 3, 5].map((index) => parseInt(hex.slice(index, index + 2), 16));
}
function luminance(hex) {
  const values = rgb(hex).map((v) => {
    const n = v / 255;
    return n <= 0.03928 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * values[0] + 0.7152 * values[1] + 0.0722 * values[2];
}
function contrast(a, b) {
  const [bright, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (bright + 0.05) / (dark + 0.05);
}
test("theme has exactly all 51 tokens and valid references", () => {
  assert.equal(theme.name, "arcoiris-refined");
  assert.deepEqual(Object.keys(theme.colors).sort(), required.sort());
  for (const value of Object.values(theme.colors)) {
    const resolved = resolve(value);
    assert.ok(
      resolved === "" ||
        typeof resolved === "number" ||
        /^#[0-9a-f]{6}$/i.test(resolved),
      `invalid ${value}`,
    );
  }
});
test("primary text contrast is readable", () => {
  assert.ok(contrast(resolve(theme.colors.text), theme.vars.background) >= 7);
  assert.ok(
    contrast(
      resolve(theme.colors.userMessageText),
      resolve(theme.colors.userMessageBg),
    ) >= 7,
  );
});
test("schema and provenance references use HTTPS", () => {
  assert.match(theme.$schema, /^https:\/\//);
});
