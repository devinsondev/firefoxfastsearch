import test from "node:test";
import assert from "node:assert/strict";
import { ALARM_PREFIX, normalizeAutoCloseSeconds, MAX_AUTO_CLOSE_SECONDS,
  registerMultiSession, multiSessionForWindow, closeMultiSession,
  forgetMultiWindow, closeAllMultiSessions } from "../extension/core/multi-sessions.js";

function mockBrowser() {
  const data = {};
  const removed = [], alarms = [], cleared = [];
  const api = {
    storage: { session: {
      get: async key => ({ [key]: data[key] }),
      set: async entry => { Object.assign(data, entry); },
    } },
    alarms: { create: async (name, info) => { alarms.push({ name, info }); },
      clear: async name => { cleared.push(name); return true; } },
    windows: { remove: async id => { removed.push(id); } },
  };
  return { api, data, removed, alarms, cleared };
}

test("custom timer validates integer seconds, 0 disables auto close", () => {
  assert.equal(normalizeAutoCloseSeconds(), 0);
  assert.equal(normalizeAutoCloseSeconds("0"), 0);
  assert.equal(normalizeAutoCloseSeconds("7"), 7);
  assert.equal(normalizeAutoCloseSeconds(77), 77);
  assert.equal(normalizeAutoCloseSeconds("1.2"), 0);
  assert.equal(normalizeAutoCloseSeconds(-1), 0);
  assert.equal(normalizeAutoCloseSeconds(MAX_AUTO_CLOSE_SECONDS + 1), 0);
});

test("groups store only IDs and timestamps; non-managed pages get no control", async () => {
  const { api, data, alarms } = mockBrowser();
  const when = Date.now() + 12000;
  await registerMultiSession(api, {
    id: "multi-abc", windowIds: [41, 42], expiresAt: when, language: "ru",
  });
  assert.deepEqual(await multiSessionForWindow(api, 41),
    { id: "multi-abc", expiresAt: when, language: "ru" });
  assert.equal(await multiSessionForWindow(api, 43), null);
  assert.equal(alarms[0].name, ALARM_PREFIX + "multi-abc");
  assert.equal(alarms[0].info.when, when);
  assert.deepEqual(data.multiSearchSessions[0].windowIds, [41, 42]);
});

test("close-all button closes only its own group and cannot control others", async () => {
  const { api, removed, cleared } = mockBrowser();
  await registerMultiSession(api, { id: "multi-one", windowIds: [41, 42] });
  await registerMultiSession(api, { id: "multi-two", windowIds: [100, 101] });
  assert.equal(await closeMultiSession(api, "multi-two", 41), false);
  assert.deepEqual(removed, []);
  assert.equal(await closeMultiSession(api, "multi-one", 41), true);
  assert.deepEqual(removed.sort((a,b) => a - b), [41, 42]);
  assert.equal(await multiSessionForWindow(api, 100) !== null, true);
  assert.ok(cleared.includes(ALARM_PREFIX + "multi-one"));
  assert.equal(await closeMultiSession(api, "multi-one", 41), false);
  assert.equal(await closeMultiSession(api, "multi-two"), true);
  assert.deepEqual(removed.sort((a,b) => a - b), [41, 42, 100, 101]);
});

test("manually closed windows are removed from tracked sessions", async () => {
  const { api, cleared, removed } = mockBrowser();
  await registerMultiSession(api, { id: "multi-abc", windowIds: [4, 5] });
  await forgetMultiWindow(api, 4);
  assert.equal(await multiSessionForWindow(api, 4), null);
  assert.equal((await multiSessionForWindow(api, 5)).id, "multi-abc");
  await forgetMultiWindow(api, 5);
  assert.equal(await multiSessionForWindow(api, 5), null);
  assert.ok(cleared.includes(ALARM_PREFIX + "multi-abc"));
  assert.deepEqual(removed, []);
});

test("global close action closes all registered batches, but no ordinary windows", async () => {
  const { api, removed } = mockBrowser();
  await registerMultiSession(api, { id: "multi-a", windowIds: [10] });
  await registerMultiSession(api, { id: "multi-b", windowIds: [20, 30] });
  await closeAllMultiSessions(api);
  assert.deepEqual(removed.sort((a,b) => a - b), [10,20,30]);
  assert.equal(await multiSessionForWindow(api, 200), null);
});
