const ALIASES = {
  ",": "Comma", ".": "Period", " ": "Space", "ArrowUp": "Up",
  ArrowDown: "Down", ArrowLeft: "Left", ArrowRight: "Right",
};
const NAMED = new Set([
  "Comma", "Period", "Home", "End", "PageUp", "PageDown", "Space",
  "Insert", "Delete", "Up", "Down", "Left", "Right",
]);

// Returns null while pressing modifier keys; throws for unsupported sequences.
export function shortcutFromEvent(event, isMac = false) {
  if (["Control", "Alt", "Shift", "Meta"].includes(event.key)) return null;
  const code = event.code ?? "";
  let key = ALIASES[event.key] ?? event.key;
  if (/^Key[A-Z]$/.test(code)) key = code.slice(3);
  else if (/^Digit[0-9]$/.test(code)) key = code.slice(5);
  else if (key.length === 1) key = key.toUpperCase();
  if (!/^[A-Z0-9]$/.test(key) && !NAMED.has(key) && !/^F(?:[1-9]|1[0-9])$/.test(key)) {
    throw new Error("unsupported");
  }
  const modifiers = [
    event.ctrlKey && (isMac ? "MacCtrl" : "Ctrl"),
    event.altKey && "Alt", event.metaKey && "Command", event.shiftKey && "Shift",
  ].filter(Boolean);
  const primary = modifiers.some(modifier => modifier !== "Shift");
  if (modifiers.length > 2 || (!primary && !/^F(?:[1-9]|1[0-9])$/.test(key))) {
    throw new Error("needsModifier");
  }
  return [...modifiers, key].join("+");
}

export async function assignShortcut(api, name, shortcut) {
  const commands = await api.commands.getAll();
  if (shortcut && commands.some(command => command.name !== name && command.shortcut === shortcut)) {
    throw new Error("conflicting");
  }
  await api.commands.update({ name, shortcut });
}
