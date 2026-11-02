import test from "node:test";
import assert from "node:assert/strict";
import { openMultiSearch, tileWindows } from "../extension/core/multi-search.js";

const area = { left: 0, top: 0, width: 1920, height: 1080 };

function setup({ failFirstCreate = false, failFirstFocus = false } = {}) {
  const created = [], focusAttempts = [], events = [], sessions = {};
  const tiles = tileWindows(area, 4);
  let next = 0;
  const api = {
    tabs: {
      query: async ({ windowId } = {}) => windowId ? [] : [{ id: 9, windowId: 5 }],
      sendMessage: async () => { events.push("notified"); },
    },
    windows: {
      get: async id => id === 5 ? { ...area, state: "maximized" }
        : { ...tiles[(id - 101)], state: "normal" },
      create: async details => {
        next++;
        if (failFirstCreate && next === 1) throw new Error("window creation blocked");
        const id = 100 + next;
        created.push({ id, ...details });
        events.push("created");
        return { id };
      },
      update: async (id, details) => {
        if (details.focused) {
          focusAttempts.push(id);
          events.push("focused");
          if (failFirstFocus && id === created[0].id) throw new Error("window closed");
        }
        return { id, ...details };
      },
    },
    storage: {
      local: { get: async () => ({}) },
      session: { get: async key => ({ [key]: sessions[key] }),
        set: async data => { Object.assign(sessions, data); events.push("registered"); } },
    },
    alarms: { create: async () => {} },
  };
  return { api, created, focusAttempts, events };
}

const launch = api => openMultiSearch(api, {
  tab: { id: 9, windowId: 5 }, selectedText: "search",
  screenBounds: area, outerBounds: area,
});

test("first popup receives focus during creation, before other pages or overlays load", async () => {
  const { api, created, focusAttempts, events } = setup();
  const result = await launch(api);
  assert.equal(result.opened, 4);
  assert.deepEqual(created.map(item => item.focused), [true, false, false, false]);
  assert.deepEqual(focusAttempts, [101, 101, 101, 101]);
  assert.ok(events.indexOf("focused") < events.indexOf("notified"));
  assert.ok(events.indexOf("focused") < events.indexOf("created", events.indexOf("created") + 1));
  assert.equal(events.at(-1), "notified", "do not steal focus when buttons finish loading");
});

test("focus falls back to the next popup if the first one was closed", async () => {
  const { api, created, focusAttempts } = setup({ failFirstFocus: true });
  const originalWarn = console.warn;
  console.warn = () => {};
  try {
    assert.equal((await launch(api)).opened, 4);
  } finally {
    console.warn = originalWarn;
  }
  assert.equal(created.length, 4);
  assert.equal(focusAttempts[0], 101);
  assert.ok(focusAttempts.includes(102), "falls back to another open search window");
  assert.equal(focusAttempts.at(-1), 102);
});

test("first successfully created popup receives initial focus after a creation failure", async () => {
  const { api, created, focusAttempts } = setup({ failFirstCreate: true });
  const originalWarn = console.warn;
  console.warn = () => {};
  try {
    const result = await launch(api);
    assert.equal(result.opened, 3);
    assert.equal(result.failed, 1);
  } finally {
    console.warn = originalWarn;
  }
  assert.deepEqual(created.map(item => item.focused), [true, false, false]);
  assert.deepEqual(focusAttempts, [102, 102, 102]);
});
