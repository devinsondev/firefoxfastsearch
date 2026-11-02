import test from "node:test";
import assert from "node:assert/strict";
import { migrateCloseShortcut, DEFAULT_CLOSE_SHORTCUT, OLD_DEFAULT_CLOSE_SHORTCUT }
  from "../extension/core/close-shortcut-migration.js";

function mockShortcut(shortcut = OLD_DEFAULT_CLOSE_SHORTCUT, extra = []) {
  const changes = [];
  const api = { commands: {
    getAll: async () => [{ name: "close-multi-search", shortcut }, ...extra],
    update: async value => { changes.push(value); },
  } };
  return { api, changes };
}

test("upgrading 1.5.6 migrates unchanged Ctrl+Alt+X to Ctrl+Alt+F2", async () => {
  const { api, changes } = mockShortcut();
  const changed = await migrateCloseShortcut(api,
    { reason: "update", previousVersion: "1.5.6" });
  assert.equal(changed, true);
  assert.deepEqual(changes,
    [{ name: "close-multi-search", shortcut: DEFAULT_CLOSE_SHORTCUT }]);
});
test("earlier upgrade also migrates the old default", async () => {
  const { api, changes } = mockShortcut();
  assert.equal(await migrateCloseShortcut(api,
    { reason: "update", previousVersion: "1.5.3" }), true);
  assert.equal(changes.length, 1);
});
test("custom, cleared and already-updated shortcuts are never overwritten", async () => {
  for (const shortcut of ["Ctrl+Alt+K", "", DEFAULT_CLOSE_SHORTCUT]) {
    const { api, changes } = mockShortcut(shortcut);
    assert.equal(await migrateCloseShortcut(api,
      { reason: "update", previousVersion: "1.5.6" }), false);
    assert.deepEqual(changes, []);
  }
});
test("new installation and later releases never migrate", async () => {
  for (const details of [
    { reason: "install" },
    { reason: "update", previousVersion: "1.5.7" },
    { reason: "update", previousVersion: "1.6.0" },
    { reason: "update", previousVersion: "2.0.0" },
    { reason: "update", previousVersion: "invalid" },
  ]) {
    const { api, changes } = mockShortcut();
    assert.equal(await migrateCloseShortcut(api, details), false);
    assert.deepEqual(changes, []);
  }
});
test("do not claim a new default assigned to another extension command", async () => {
  const { api, changes } = mockShortcut(OLD_DEFAULT_CLOSE_SHORTCUT,
    [{ name: "search-profile-05", shortcut: DEFAULT_CLOSE_SHORTCUT }]);
  assert.equal(await migrateCloseShortcut(api,
    { reason: "update", previousVersion: "1.5.6" }), false);
  assert.deepEqual(changes, []);
});
