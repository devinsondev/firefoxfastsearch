import test from "node:test";
import assert from "node:assert/strict";
import { normalizeMultiTargets, tileWindows, openMultiSearch } from "../extension/core/multi-search.js";

test("first launch defaults to four providers", () => {
  assert.deepEqual(normalizeMultiTargets().map(x => x.engine),
    ["google", "yandex", "bing", "duckduckgo"]);
});
test("empty explicit list does not reset defaults", () => {
  assert.deepEqual(normalizeMultiTargets([]), []);
});
test("invalid and insecure templates are ignored", () => {
  assert.deepEqual(normalizeMultiTargets([
    { engine: "custom", template: "http://example.com/?q={query}" },
    { engine: "custom", template: "https://example.com/search?q={query}" },
    { engine: "__proto__" }, { engine: "google" },
  ]), [{ engine: "custom", template: "https://example.com/search?q={query}" }, { engine: "google" }]);
});
test("four windows tile into four balanced quadrants", () => {
  const tiles = tileWindows({ left: 0, top: 0, width: 1920, height: 1080 }, 4);
  assert.equal(tiles.length, 4);
  assert.deepEqual(tiles.map(x => x.width), [960, 960, 960, 960]);
  assert.deepEqual(tiles.map(x => x.height), [540, 540, 540, 540]);
  assert.deepEqual(tiles.map(x => [x.left, x.top]),
    [[0, 0], [960, 0], [0, 540], [960, 540]]);
});
test("uses nonzero screen offsets and no overlap for 5 windows", () => {
  const area = { left: -1920, top: 40, width: 1920, height: 1080 };
  const tiles = tileWindows(area, 5);
  assert.equal(tiles.length, 5);
  for (const tile of tiles) {
    assert.ok(tile.left >= area.left && tile.top >= area.top);
    assert.ok(tile.left + tile.width <= area.left + area.width);
    assert.ok(tile.top + tile.height <= area.top + area.height);
  }
  for (let i = 0; i < tiles.length; i++) for (let j = i + 1; j < tiles.length; j++) {
    const a = tiles[i], b = tiles[j];
    assert.ok(a.left + a.width <= b.left || b.left + b.width <= a.left ||
      a.top + a.height <= b.top || b.top + b.height <= a.top);
  }
});
test("does not open more windows than comfortably fit", () => {
  const tiles = tileWindows({ left: 0, top: 0, width: 1200, height: 800 }, 16);
  assert.ok(tiles.length <= 4);
});
test("selected text opens four distinct search pages in popups", async () => {
  const created = [];
  const api = {
    tabs: { query: async () => [{ id: 10, windowId: 9 }] },
    storage: { local: { get: async () => ({}) } },
    scripting: { executeScript: async () => [{ result: { focused: true, text: "hello & world",
      screenBounds: { left: 0, top: 0, width: 1920, height: 1080 } } }] },
    windows: { create: async opts => { created.push(opts); } },
  };
  const result = await openMultiSearch(api);
  assert.equal(result.opened, 4);
  assert.equal(new Set(created.map(x => new URL(x.url).hostname)).size, 4);
  assert.ok(created.every(x => x.type === "popup"));
});
test("no selection means no windows", async () => {
  const api = {
    tabs: { query: async () => [{ id: 10, windowId: 9 }] },
    scripting: { executeScript: async () => [{ result: { text: "", focused: true } }] },
  };
  assert.equal((await openMultiSearch(api)).opened, 0);
});
