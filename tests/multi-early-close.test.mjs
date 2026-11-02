import test from "node:test";
import assert from "node:assert/strict";
import { openMultiSearch, tileWindows } from "../extension/core/multi-search.js";
import { closeAllMultiSessions } from "../extension/core/multi-sessions.js";

const area = { left: 0, top: 0, width: 1920, height: 1080 };
function deferred() {
  let resolve;
  const promise = new Promise(r => { resolve = r; });
  return { promise, resolve };
}

function mock({ blockSecond = null, blockLayout = null, secondStarted, layoutStarted } = {}) {
  const store = {}, created = [], removed = [], focused = [], notifications = [];
  const tiles = tileWindows(area, 4);
  let attempts = 0;
  const api = {
    tabs: {
      query: async ({ windowId } = {}) => windowId ? [] : [{ id: 7, windowId: 5 }],
      sendMessage: async (id, message) => { notifications.push({ id, message }); },
    },
    storage: {
      local: { get: async () => ({}) },
      session: {
        get: async key => ({ [key]: store[key] }),
        set: async changes => Object.assign(store, changes),
      },
    },
    windows: {
      get: async id => id === 5 ? { ...area, state: "maximized" }
        : { ...tiles[id - 101], state: "normal" },
      create: async options => {
        attempts++;
        if (attempts === 2 && blockSecond) {
          secondStarted.resolve();
          await blockSecond.promise;
        }
        const id = 100 + attempts;
        created.push({ id, ...options });
        return { id };
      },
      update: async (id, bounds) => {
        if (bounds.focused) focused.push(id);
        if (blockLayout && bounds.width && id === 101) {
          layoutStarted.resolve();
          await blockLayout.promise;
        }
        return { id, ...bounds };
      },
      remove: async id => { removed.push(id); },
    },
    alarms: { create: async () => {}, clear: async () => true },
  };
  return { api, store, created, removed, focused, notifications,
    get attempts() { return attempts; } };
}

function launch(api) {
  return openMultiSearch(api, { tab: { id: 7, windowId: 5 },
    selectedText: "hello", screenBounds: area, outerBounds: area });
}

test("Ctrl+Alt+F2 closes the first focused window while the second is still opening", async () => {
  const blockSecond = deferred(), secondStarted = deferred();
  const state = mock({ blockSecond, secondStarted });
  const opening = launch(state.api);
  await secondStarted.promise;
  assert.deepEqual(state.store.multiSearchSessions[0].windowIds, [101]);
  assert.deepEqual(state.focused, [101], "first popup is already focused");
  await closeAllMultiSessions(state.api);
  assert.deepEqual(state.removed, [101]);
  blockSecond.resolve();
  await opening;
  assert.equal(state.attempts, 2, "do not launch third/fourth window after close");
  assert.deepEqual(state.removed.sort(), [101, 102]);
  assert.deepEqual(state.store.multiSearchSessions, []);
  assert.deepEqual(state.focused, [101], "never re-focus closed windows");
});

test("closing works before delayed tile corrections or Close all overlays", async () => {
  const blockLayout = deferred(), layoutStarted = deferred();
  const state = mock({ blockLayout, layoutStarted });
  const opening = launch(state.api);
  await layoutStarted.promise;
  assert.equal(state.created.length, 4);
  assert.deepEqual(state.store.multiSearchSessions[0].windowIds, [101,102,103,104]);
  assert.deepEqual(state.focused, [101,101,101,101]);
  assert.equal(state.notifications.length, 0,
    "selection overlays have not loaded, but windows are already registered");
  await closeAllMultiSessions(state.api);
  assert.deepEqual(state.removed.sort(), [101,102,103,104]);
  blockLayout.resolve();
  await opening;
  assert.equal(state.focused.length, 4, "slow layout must never steal focus later");
});
