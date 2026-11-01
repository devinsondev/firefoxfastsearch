import test from "node:test";
import assert from "node:assert/strict";
import { assignShortcut, shortcutFromEvent } from "../extension/ui/shortcuts.js";

function keyboard(key, modifiers = {}, code = "") {
  return { key, code, ctrlKey: false, altKey: false, metaKey: false, shiftKey: false, ...modifiers };
}
test("allows a bare F1", () => assert.equal(shortcutFromEvent(keyboard("F1")), "F1"));
test("supports F19 in Firefox 135+", () => assert.equal(shortcutFromEvent(keyboard("F19")), "F19"));
test("Ctrl+Alt+G maps correctly", () => {
  assert.equal(shortcutFromEvent(keyboard("g", { ctrlKey: true, altKey: true }, "KeyG")), "Ctrl+Alt+G");
});
test("Ctrl+Shift+Comma maps correctly", () => {
  assert.equal(shortcutFromEvent(keyboard(",", { ctrlKey: true, shiftKey: true })), "Ctrl+Shift+Comma");
});
test("Mac uses MacCtrl and Command", () => {
  assert.equal(shortcutFromEvent(keyboard("k", { ctrlKey: true }), true), "MacCtrl+K");
  assert.equal(shortcutFromEvent(keyboard("k", { metaKey: true }), true), "Command+K");
});
test("modifier by itself remains in capture mode", () => {
  assert.equal(shortcutFromEvent(keyboard("Control", { ctrlKey: true })), null);
});
test("plain letters must have Ctrl/Alt/Command", () => {
  assert.throws(() => shortcutFromEvent(keyboard("a")), /needsModifier/);
});
test("unsupported keys are rejected", () => {
  assert.throws(() => shortcutFromEvent(keyboard("Escape")), /unsupported/);
  assert.throws(() => shortcutFromEvent(keyboard("F20")), /unsupported/);
});
test("more than two modifiers is rejected", () => {
  assert.throws(() => shortcutFromEvent(keyboard("a", { ctrlKey: true, altKey: true, shiftKey: true })), /needsModifier/);
});
test("refuses collisions with other command slots", async () => {
  const api = { commands: {
    getAll: async () => [{ name: "search-background", shortcut: "Ctrl+Alt+G" }],
    update: async () => { throw new Error("should not be called"); },
  } };
  await assert.rejects(assignShortcut(api, "search-foreground", "Ctrl+Alt+G"), /conflicting/);
});
test("shortcut can be cleared", async () => {
  let updated;
  const api = { commands: {
    getAll: async () => [], update: async value => { updated = value; },
  } };
  await assignShortcut(api, "search-foreground", "");
  assert.deepEqual(updated, { name: "search-foreground", shortcut: "" });
});

test("close-all shortcut can be remapped and respects F2 conflicts", async () => {
  const updates = [];
  const commands = [
    { name: "search-multi", shortcut: "F2" },
    { name: "close-multi-search", shortcut: "Ctrl+Alt+X" },
  ];
  const api = { commands: {
    getAll: async () => commands,
    update: async value => { updates.push(value); },
  } };
  await assert.rejects(
    assignShortcut(api, "close-multi-search", "F2"), /conflicting/
  );
  assert.deepEqual(updates, []);
  await assignShortcut(api, "close-multi-search", "Ctrl+Alt+Z");
  assert.deepEqual(updates, [
    { name: "close-multi-search", shortcut: "Ctrl+Alt+Z" },
  ]);
});
