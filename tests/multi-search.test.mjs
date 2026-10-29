import test from "node:test";
import assert from "node:assert/strict";
import { normalizeMultiTargets, normalizeMultiDisplayMode,
  tabbedWindowBounds, tileWindows, openMultiSearch
} from "../extension/core/multi-search.js";

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
test("four windows launch concurrently and auto-close uses user-supplied seconds", async () => {
  const created = [], messages = [], alarms = [], sessionStore = {};
  let active = 0, peak = 0;
  const api = {
    tabs: { query: async () => [{ id: 10, windowId: 9 }],
      sendMessage: async (id, message) => { messages.push({ id, message }); } },
    storage: {
      local: { get: async () => ({ multiAutoCloseSeconds: 12, uiLanguage: "ru" }) },
      session: {
        get: async key => ({ [key]: sessionStore[key] }),
        set: async data => { Object.assign(sessionStore, data); },
      },
    },
    scripting: { executeScript: async () => [{ result: { focused: true, text: "hello & world",
      screenBounds: { left: 0, top: 0, width: 1920, height: 1080 } } }] },
    windows: { create: async options => {
      const index = created.push(options);
      active++; peak = Math.max(peak, active);
      await new Promise(resolve => setImmediate(resolve));
      active--;
      return { id: 100 + index, tabs: [{ id: 200 + index }] };
    } },
    alarms: { create: async (name, info) => { alarms.push({ name, info }); } },
  };
  const startTime = Date.now();
  const result = await openMultiSearch(api);
  assert.equal(result.opened, 4);
  assert.equal(peak, 4, "all window creations should begin before any finishes");
  assert.equal(new Set(created.map(x => new URL(x.url).hostname)).size, 4);
  assert.ok(created.every(x => x.type === "popup"));
  assert.equal(messages.length, 5);
  assert.ok(messages.some(x => (x.message || x.value).action === "multiSourceControl"));
  assert.equal(alarms.length, 1);
  assert.ok(alarms[0].info.when >= startTime + 12000);
  assert.ok(alarms[0].info.when <= Date.now() + 12000);
  assert.equal(sessionStore.multiSearchSessions[0].windowIds.length, 4);
  assert.equal(sessionStore.multiSearchSessions[0].language, "ru");
});
test("disabled auto-close never creates an alarm", async () => {
  const sessionStore = {}, alarms = [];
  const api = {
    tabs: { query: async () => [{ id: 10, windowId: 9 }], sendMessage: async () => {} },
    storage: {
      local: { get: async () => ({ multiAutoCloseSeconds: 0 }) },
      session: { get: async key => ({ [key]: sessionStore[key] }),
        set: async data => Object.assign(sessionStore, data) },
    },
    scripting: { executeScript: async () => [{ result: { focused: true, text: "foo",
      screenBounds: { left: 0, top: 0, width: 1920, height: 1080 } } }] },
    windows: { create: async () => ({ id: Math.floor(Math.random() * 100000) + 1 }) },
    alarms: { create: async (...args) => { alarms.push(args); } },
  };
  assert.equal((await openMultiSearch(api)).opened, 4);
  assert.equal(alarms.length, 0);
});
test("no selection means no windows", async () => {
  const api = {
    tabs: { query: async () => [{ id: 10, windowId: 9 }] },
    scripting: { executeScript: async () => [{ result: { text: "", focused: true } }] },
  };
  assert.equal((await openMultiSearch(api)).opened, 0);
});

test("single window mode is opt-in and invalid saved values fall back to tiles", () => {
  assert.equal(normalizeMultiDisplayMode(undefined), "windows");
  assert.equal(normalizeMultiDisplayMode("window"), "windows");
  assert.equal(normalizeMultiDisplayMode("tabs"), "tabs");
  assert.deepEqual(tabbedWindowBounds(undefined), {});
  assert.deepEqual(tabbedWindowBounds({ left: -1920, top: 20, width: 1920, height: 1080 }),
    { left: -1776, top: 101, width: 1632, height: 918 });
});

test("tabbed mode opens one normal Firefox window with four actual search tabs", async () => {
  const created = [], messages = [], store = {}, alarms = [];
  const api = {
    tabs: {
      query: async options => options?.windowId === 55
        ? [101, 102, 103, 104].map(id => ({ id, windowId: 55 }))
        : [{ id: 20, windowId: 10 }],
      sendMessage: async (id, value) => { messages.push({ id, value }); },
    },
    scripting: {
      executeScript: async () => [{ result: { text: "forest fox", focused: true,
        screenBounds: { left: 0, top: 0, width: 1920, height: 1080 } } }],
    },
    storage: {
      local: { get: async () => ({ multiDisplayMode: "tabs", multiAutoCloseSeconds: 15 }) },
      session: { get: async key => ({ [key]: store[key] }),
        set: async entry => Object.assign(store, entry) },
    },
    windows: {
      create: async options => {
        created.push(options);
        return { id: 55, tabs: [101, 102, 103, 104].map(id => ({ id })) };
      },
    },
    alarms: { create: async (name, info) => { alarms.push({ name, info }); } },
  };
  const result = await openMultiSearch(api);
  assert.equal(result.opened, 1);
  assert.equal(result.requested, 4);
  assert.equal(result.tabs, 4);
  assert.equal(result.mode, "tabs");
  assert.equal(result.failed, 0);
  assert.equal(result.skipped, 0);
  assert.equal(created.length, 1);
  assert.equal(created[0].type, "normal");
  assert.equal(created[0].focused, true);
  assert.equal(created[0].url.length, 4);
  assert.deepEqual(created[0].url.map(url => new URL(url).hostname),
    ["www.google.com", "yandex.ru", "www.bing.com", "duckduckgo.com"]);
  assert.ok(created[0].url.every(url => new URL(url).search.includes("forest")));
  assert.deepEqual(store.multiSearchSessions[0].windowIds, [55]);
  assert.equal(messages.length, 5);
  assert.ok(messages.some(x => (x.message || x.value).action === "multiSourceControl"));
  assert.equal(alarms.length, 1);
});

test("tabbed mode can open all selected sites even when 16 tiled windows would not fit", async () => {
  const created = [], sessions = {};
  const api = {
    tabs: {
      query: async args => args?.windowId === 40 ? [] : [{ id: 1, windowId: 2 }],
    },
    storage: {
      local: { get: async () => ({ multiDisplayMode: "tabs",
        multiTargets: Array.from({ length: 16 }, () => ({ engine: "bing" })) }) },
      session: { get: async key => ({ [key]: sessions[key] }),
        set: async value => Object.assign(sessions, value) },
    },
    windows: { create: async details => {
      created.push(details);
      return { id: 40, tabs: [] };
    } },
    alarms: { create: async () => {} },
  };
  const result = await openMultiSearch(api, {
    tab: { id: 1, windowId: 2 }, selectedText: "query",
    screenBounds: { left: 0, top: 0, width: 1080, height: 720 },
  });
  assert.equal(result.opened, 1);
  assert.equal(result.tabs, 16);
  assert.equal(created[0].url.length, 16);
  assert.deepEqual(sessions.multiSearchSessions[0].windowIds, [40]);
});

test("empty configured provider list never creates an empty tabbed window", async () => {
  let called = false;
  const api = {
    tabs: { query: async () => [{ id: 12, windowId: 3 }] },
    storage: { local: { get: async () => ({
      multiDisplayMode: "tabs", multiTargets: [] }) } },
    windows: { create: async () => { called = true; } },
  };
  const result = await openMultiSearch(api, {
    tab: { id: 12, windowId: 3 }, selectedText: "anything",
    screenBounds: { left: 0, top: 0, width: 1080, height: 720 },
  });
  assert.equal(result.opened, 0);
  assert.equal(result.reason, "noTargets");
  assert.equal(called, false);
});

