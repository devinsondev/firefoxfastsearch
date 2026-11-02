import test from "node:test";
import assert from "node:assert/strict";
import { registerMultiSession, appendMultiSessionWindow, isMultiSessionActive,
  closeAllMultiSessions, closeMultiSession } from "../extension/core/multi-sessions.js";

function deferred() {
  let release;
  const promise = new Promise(resolve => { release = resolve; });
  return { promise, release };
}

function mockApi() {
  const data = {}, removed = [], notifications = [], cleared = [];
  const api = {
    storage: {
      session: {
        get: async key => ({ [key]: data[key] }),
        set: async value => Object.assign(data, value),
      },
    },
    windows: { remove: id => { removed.push(id); return Promise.resolve(); } },
    tabs: { sendMessage: async (id, message) => notifications.push({ id, message }) },
    alarms: {
      create: async () => {},
      clear: async key => { cleared.push(key); return true; },
    },
  };
  return { api, data, removed, notifications, cleared };
}

test("Ctrl+Alt+F2 requests every window removal BEFORE a slow storage read", async () => {
  const { api, data, removed } = mockApi();
  await registerMultiSession(api, {
    id: "multi-fast", windowIds: [21, 22, 23], sourceTabId: 10,
  });
  const delayed = deferred();
  const oldGet = api.storage.session.get;
  api.storage.session.get = async key => { await delayed.promise; return oldGet(key); };

  const closing = closeAllMultiSessions(api);
  assert.deepEqual(removed, [21, 22, 23],
    "windows.remove must be dispatched synchronously, before storage can respond");
  assert.equal(await isMultiSessionActive(api, "multi-fast"), false);
  delayed.release();
  await closing;
  assert.deepEqual(data.multiSearchSessions, []);
});

test("the on-page Close all button also closes without waiting for storage", async () => {
  const { api, removed } = mockApi();
  await registerMultiSession(api, {
    id: "multi-button", windowIds: [31, 32], sourceTabId: 7,
  });
  const delayed = deferred();
  const oldGet = api.storage.session.get;
  api.storage.session.get = async key => { await delayed.promise; return oldGet(key); };
  const closing = closeMultiSession(api, "multi-button", 31, 31);
  assert.deepEqual(removed, [31, 32]);
  delayed.release();
  assert.equal(await closing, true);
});

test("an unauthorized page cannot trigger fast close of another group's windows", async () => {
  const { api, removed } = mockApi();
  await registerMultiSession(api, {
    id: "multi-owned", windowIds: [41, 42], sourceTabId: 14,
  });
  assert.equal(await closeMultiSession(api, "multi-owned", 99, 100), false);
  assert.deepEqual(removed, []);
  assert.equal(await isMultiSessionActive(api, "multi-owned"), true);
  await closeMultiSession(api, "multi-owned", 41, 41);
  assert.deepEqual(removed, [41, 42]);
});

test("close requests include a window whose storage append is still pending", async () => {
  const { api, data, removed } = mockApi();
  await registerMultiSession(api, { id: "multi-pending", windowIds: [51] });
  const delayed = deferred();
  const oldGet = api.storage.session.get;
  api.storage.session.get = async key => { await delayed.promise; return oldGet(key); };
  const appending = appendMultiSessionWindow(api, "multi-pending", 52);
  const closing = closeAllMultiSessions(api);
  assert.deepEqual(removed, [51, 52]);
  delayed.release();
  assert.equal(await appending, false);
  await closing;
  assert.deepEqual(data.multiSearchSessions, []);
});

test("a second close after the first group was removed does not affect other windows", async () => {
  const { api, removed } = mockApi();
  await registerMultiSession(api, { id: "multi-once", windowIds: [61, 62] });
  await closeAllMultiSessions(api);
  await closeAllMultiSessions(api);
  assert.deepEqual(removed, [61, 62]);
});
