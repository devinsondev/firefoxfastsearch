import test from "node:test";
import assert from "node:assert/strict";
import { buildSearchUrl, defaultProfile, firstFreeSlot, initialProfiles, normalizeProfiles, SEARCH_ENGINES, SLOT_IDS } from "../extension/core/profiles.js";

test("declares 16 independent stable command slots", () => {
  assert.equal(SLOT_IDS.length, 16);
  assert.equal(new Set(SLOT_IDS).size, 16);
  assert.deepEqual(SLOT_IDS.slice(0, 2), ["search-foreground", "search-background"]);
});
test("first install has F1 profile and no background clutter", () => {
  assert.deepEqual(initialProfiles(undefined, []), [defaultProfile()]);
});
test("migration keeps old selected search engine and background command", () => {
  const profiles = initialProfiles("yandex", [{ name: "search-background", shortcut: "Ctrl+Alt+B" }]);
  assert.equal(profiles.length, 2);
  assert.equal(profiles[0].engine, "yandex");
  assert.equal(profiles[1].engine, "yandex");
  assert.equal(profiles[1].target, "background");
});
test("migration ignores invalid old search engine", () => {
  assert.equal(initialProfiles("bad", [])[0].engine, "google");
});
test("slot reuse works after removing a profile", () => {
  assert.equal(firstFreeSlot([defaultProfile()]), SLOT_IDS[1]);
  assert.equal(firstFreeSlot(SLOT_IDS.map(id => defaultProfile(id))), null);
});
test("normalization ignores duplicated/unknown IDs and sanitizes input", () => {
  const profiles = normalizeProfiles([
    { id: SLOT_IDS[1], name: "x".repeat(70), target: "background", engine: "bing" },
    { id: SLOT_IDS[1], name: "duplicate" },
    { id: "not-a-real-command", engine: "google" },
    { id: SLOT_IDS[2], engine: "__proto__", target: "fake" },
  ]);
  assert.equal(profiles.length, 2);
  assert.equal(profiles[0].name.length, 40);
  assert.equal(profiles[1].engine, "google");
  assert.equal(profiles[1].target, "foreground");
});
test("empty array is intentional and not replaced with defaults", () => {
  assert.deepEqual(normalizeProfiles([]), []);
  assert.equal(normalizeProfiles(null), null);
});
for (const engine of Object.keys(SEARCH_ENGINES)) {
  test(`${engine}: encodes non-ASCII text and punctuation`, () => {
    const url = new URL(buildSearchUrl({ ...defaultProfile(), engine }, "  Привет & мир  "));
    assert.equal(url.searchParams.get(SEARCH_ENGINES[engine].param), "Привет & мир");
  });
}
test("query whitespace is normalized", () => {
  const result = new URL(buildSearchUrl(defaultProfile(), " a \n b  \t  c "));
  assert.equal(result.searchParams.get("q"), "a b c");
});
test("empty selection does not open a tab", () => {
  assert.equal(buildSearchUrl(defaultProfile(), "   "), null);
});
test("selected text is bounded to 2048 characters", () => {
  assert.equal(new URL(buildSearchUrl(defaultProfile(), "a".repeat(5000))).searchParams.get("q").length, 2048);
});
test("custom engine replaces all occurrences safely", () => {
  const custom = { engine: "custom", template: "https://example.com/find?q={query}&copy={query}" };
  const url = new URL(buildSearchUrl(custom, "a&b"));
  assert.equal(url.searchParams.get("q"), "a&b");
  assert.equal(url.searchParams.get("copy"), "a&b");
});
test("rejects invalid custom templates", () => {
  for (const template of ["https://example.com/no-placeholder", "http://example.com?q={query}",
    "javascript:alert({query})", "https://user:pass@example.com?q={query}"]) {
    assert.throws(() => buildSearchUrl({ engine: "custom", template }, "foo"));
  }
});
