import test from "node:test";
import assert from "node:assert/strict";
import { calibratedWorkArea, tileWindows, openMultiSearch } from "../extension/core/multi-search.js";
import { readFileSync } from "node:fs";

const display = { left: 0, top: 0, width: 2048, height: 1228 };

test("maximized Firefox bounds override a smaller CSS page screen", () => {
  const page = { left: 0, top: 0, width: 1840, height: 1106 };
  const native = { ...display, state: "maximized" };
  const work = calibratedWorkArea(page, native, { left: 0, top: 0, width: 1840, height: 1106 });
  assert.deepEqual(work, display);
  const tiles = tileWindows(work, 4);
  assert.deepEqual(tiles.map(tile => [tile.left, tile.top, tile.width, tile.height]),
    [[0, 0, 1024, 614], [1024, 0, 1024, 614],
      [0, 614, 1024, 614], [1024, 614, 1024, 614]]);
});

test("normal Firefox window calibrates CSS screen area through the same window", () => {
  const page = { left: 0, top: 0, width: 1024, height: 614 };
  const browserWindow = { left: 200, top: 100, width: 1400, height: 850, state: "normal" };
  const pageWindow = { left: 100, top: 50, width: 700, height: 425 };
  assert.deepEqual(calibratedWorkArea(page, browserWindow, pageWindow), display);
});

test("negative monitor coordinates are kept in the browser coordinate system", () => {
  const page = { left: -960, top: 0, width: 960, height: 600 };
  const browserWindow = { left: -1800, top: 100, width: 800, height: 500, state: "normal" };
  const pageWindow = { left: -900, top: 50, width: 400, height: 250 };
  assert.deepEqual(calibratedWorkArea(page, browserWindow, pageWindow),
    { left: -1920, top: 0, width: 1920, height: 1200 });
});

test("invalid geometry and unavailable browser measurements keep safe fallback", () => {
  const page = { left: 10, top: 20, width: 1100, height: 700 };
  assert.deepEqual(calibratedWorkArea(page), page);
  assert.deepEqual(calibratedWorkArea(page,
    { left: 0, top: 0, width: 800, height: 600, state: "normal" },
    { left: 0, top: 0, width: 0, height: 0 }), page);
  assert.equal(calibratedWorkArea(null, null, null), null);
});

test("multi-search uses the maximized source window for all four popup placements", async () => {
  const created = [];
  const api = {
    tabs: { query: async () => [{ id: 9, windowId: 10 }] },
    windows: {
      get: async id => id === 10 ? { ...display, state: "maximized" } : null,
      create: async details => {
        created.push(details);
        return { id: 30 + created.length };
      },
    },
    scripting: {
      executeScript: async () => [{ frameId: 0, result: {
        focused: true, text: "test",
        screenBounds: { left: 0, top: 0, width: 1840, height: 1106 },
        outerBounds: { left: 0, top: 0, width: 1840, height: 1106 },
      } }],
    },
    storage: { local: { get: async () => ({ multiAutoCloseSeconds: 0 }) },
      session: { get: async () => ({}), set: async () => {} } },
    alarms: { create: async () => {} },
  };
  const result = await openMultiSearch(api);
  assert.equal(result.opened, 4);
  assert.deepEqual(created.map(({ left, top, width, height }) =>
    ({ left, top, width, height })), tileWindows(display, 4));
});

test("both shortcut selection and page button supply outer window metrics", () => {
  const selection = readFileSync(new URL("../extension/core/selection.js", import.meta.url), "utf8");
  const content = readFileSync(new URL("../extension/selection-icon.js", import.meta.url), "utf8");
  const background = readFileSync(new URL("../extension/background.js", import.meta.url), "utf8");
  assert.match(selection, /outerBounds/);
  assert.match(content, /action: "multiSearch"/);
  assert.match(content, /screenBounds:/);
  assert.match(content, /outerBounds:/);
  assert.match(background, /outerBounds: message.outerBounds/);
});
