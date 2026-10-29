import test from "node:test";
import assert from "node:assert/strict";
import { runSearchCommand } from "../extension/core/command-router.js";
import { CLOSE_MULTI_COMMAND, registerMultiSession } from "../extension/core/multi-sessions.js";

function mockBrowser() {
  const stored = {};
  const removed = [], notices = [];
  const browser = {
    storage: {
      session: {
        get: async name => ({ [name]: stored[name] }),
        set: async entry => { Object.assign(stored, entry); },
      },
      local: { get: async () => ({ profiles: [] }) },
    },
    tabs: {
      sendMessage: async (id, message) => { notices.push({ id, message }); },
    },
    alarms: {
      create: async () => {},
      clear: async () => true,
    },
    windows: {
      remove: async id => { removed.push(id); },
    },
  };
  return { browser, removed, notices };
}

test("close shortcut closes every multi-search group, not ordinary Firefox windows", async () => {
  const { browser, removed, notices } = mockBrowser();
  await registerMultiSession(browser, {
    id: "multi-hotkey-one", windowIds: [14, 15], sourceTabId: 20,
  });
  await registerMultiSession(browser, {
    id: "multi-hotkey-two", windowIds: [41], sourceTabId: 50,
  });
  await runSearchCommand(browser, CLOSE_MULTI_COMMAND, { id: 14, windowId: 14 });
  assert.deepEqual(removed.sort((a,b) => a-b), [14, 15, 41]);
  assert.ok(!removed.includes(99)); // An unrelated browser window
  assert.deepEqual(notices.map(item => item.id).sort((a,b) => a-b), [20, 50]);
  // Repeated presses must be idempotent.
  await runSearchCommand(browser, CLOSE_MULTI_COMMAND);
  assert.equal(removed.length, 3);
});

test("close shortcut with no search windows does nothing and never reads selection", async () => {
  const { browser, removed } = mockBrowser();
  browser.scripting = { executeScript: async () => {
    throw Error("The close shortcut must not read a webpage.");
  } };
  assert.deepEqual(await runSearchCommand(browser, CLOSE_MULTI_COMMAND), []);
  assert.deepEqual(removed, []);
});

test("unrelated shortcut cannot close extension-managed windows", async () => {
  const { browser, removed } = mockBrowser();
  await registerMultiSession(browser, { id: "multi-kept", windowIds: [70] });
  assert.equal(await runSearchCommand(browser, "inactive-profile", { id: 40 }), false);
  assert.deepEqual(removed, []);
});
