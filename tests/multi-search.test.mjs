import test from "node:test";
import assert from "node:assert/strict";
import { normalizeMultiTargets, normalizeMultiDisplayMode,
  tabbedWindowBounds, tileWindows, settleTiledWindows, openMultiSearch
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
test("five windows have uniform sizes and a centered final row", () => {
  const tiles = tileWindows({ left: 0, top: 0, width: 1800, height: 1000 }, 5);
  assert.equal(tiles.length, 5);
  assert.deepEqual(tiles.map(tile => [tile.width, tile.height]),
    Array.from({ length: 5 }, () => [600, 500]));
  assert.deepEqual(tiles.map(tile => [tile.left, tile.top]),
    [[0, 0], [600, 0], [1200, 0], [300, 500], [900, 500]]);
});
test("does not open more windows than comfortably fit", () => {
  const tiles = tileWindows({ left: 0, top: 0, width: 1200, height: 800 }, 16);
  assert.ok(tiles.length <= 4);
});
test("four windows launch in order and auto-close uses user-supplied seconds", async () => {
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
  assert.equal(peak, 1, "window creation must not race against other popup placements");
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
test("reapplies the four exact screen quadrants after all windows are created", async () => {
  const area = { left: 0, top: 0, width: 1600, height: 960 };
  const created = [], updated = [], store = {};
  const api = {
    tabs: {
      query: async options => options?.windowId ? [] : [{ id: 20, windowId: 10 }],
      sendMessage: async () => {},
    },
    scripting: { executeScript: async () => [{ result: { focused: true, text: "test",
      screenBounds: area } }] },
    storage: {
      local: { get: async () => ({}) },
      session: { get: async key => ({ [key]: store[key] }),
        set: async value => Object.assign(store, value) },
    },
    windows: {
      create: async details => {
        const index = created.push(details);
        return { id: 100 + index, left: 200, top: 200, width: 600, height: 400 };
      },
      update: async (id, bounds) => {
        updated.push({ id, ...bounds });
        return { id, ...bounds };
      },
      get: async id => updated.findLast(item => item.id === id),
    },
    alarms: { create: async () => {} },
  };
  assert.equal((await openMultiSearch(api)).opened, 4);
  assert.equal(updated.length, 8);
  assert.deepEqual(updated.slice(0, 4).map(({ width, height }) =>
    ({ width, height })), tileWindows(area, 4).map(({ width, height }) => ({ width, height })));
  assert.deepEqual(updated.slice(4, 8).map(({ left, top }) =>
    ({ left, top })), tileWindows(area, 4).map(({ left, top }) => ({ left, top })));
  assert.deepEqual(store.multiSearchSessions[0].windowIds, [101, 102, 103, 104]);
});
test("retries positioning when the window manager reports shifted bounds", async () => {
  const tile = { left: 0, top: 0, width: 800, height: 480 };
  const updated = [];
  await settleTiledWindows({
    windows: {
      update: async id => { updated.push(id); },
      get: async id => ({ ...tile, left: id === 2 ? 20 : 0 }),
    },
  }, [{ windowId: 1, tile }, { windowId: 2, tile }]);
  assert.deepEqual(updated, [1, 2, 1, 2, 2, 2]);
});
test("compensates for browser frame dimensions before moving the right tile", async () => {
  const tile = { left: 1024, top: 615, width: 1024, height: 615 };
  const calls = [], size = { left: 0, top: 0, width: 1120, height: 665 };
  const api = { windows: {
    update: async (id, details) => {
      calls.push(details);
      if (Number.isFinite(details.width)) size.width = details.width + 96;
      if (Number.isFinite(details.height)) size.height = details.height + 50;
      if (Number.isFinite(details.left)) {
        size.left = Math.min(details.left, 2048 - size.width);
      }
      if (Number.isFinite(details.top)) size.top = Math.min(details.top, 1230 - size.height);
    },
    get: async () => ({ ...size }),
  } };
  const constrained = await settleTiledWindows(api, [{ windowId: 1, tile }]);
  assert.deepEqual(constrained, []);
  assert.deepEqual(size, tile);
  assert.ok(calls.some(call => call.width === 928 && call.height === 565));
  assert.ok(calls.some(call => call.left === 1024 && call.top === 615));
  assert.ok(calls.every(call => !(Object.hasOwn(call, "left") &&
    Object.hasOwn(call, "width"))), "resize and move must be separate updates");
});
test("reports a minimum window size that Firefox refuses to shrink", async () => {
  const tile = { left: 1024, top: 0, width: 1024, height: 615 };
  const actual = { left: 928, top: 0, width: 1120, height: 665 };
  const api = { windows: {
    update: async (id, details) => {
      if (Number.isFinite(details.width)) actual.width = Math.max(1120, details.width);
      if (Number.isFinite(details.height)) actual.height = Math.max(665, details.height);
      if (Number.isFinite(details.left)) {
        actual.left = Math.min(details.left, 2048 - actual.width);
      }
      if (Number.isFinite(details.top)) actual.top = details.top;
    },
    get: async () => ({ ...actual }),
  } };
  const oldWarn = console.warn;
  console.warn = () => {};
  let constrained;
  try { constrained = await settleTiledWindows(api, [{ windowId: 1, tile }]); }
  finally { console.warn = oldWarn; }
  assert.equal(constrained.length, 1);
  assert.equal(constrained[0].expected.width, 1024);
  assert.equal(constrained[0].actual.width, 1120);
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

