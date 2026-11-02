import { CLOSE_MULTI_COMMAND } from "./multi-sessions.js";

export const OLD_DEFAULT_CLOSE_SHORTCUT = "Ctrl+Alt+X";
export const DEFAULT_CLOSE_SHORTCUT = "Ctrl+Alt+F2";

// Only migrate an unchanged legacy default when upgrading from before 1.5.7.
// Explicitly assigned/removed shortcuts stay untouched.
export async function migrateCloseShortcut(api, details) {
  if (details?.reason !== "update" || typeof details.previousVersion !== "string") {
    return false;
  }
  const parts = details.previousVersion.split(".").map(Number);
  if (parts.length !== 3 || parts.some(part => !Number.isSafeInteger(part) || part < 0)) {
    return false;
  }
  const [major, minor, patch] = parts;
  if (major > 1 || (major === 1 && (minor > 5 || (minor === 5 && patch >= 7)))) {
    return false;
  }

  const commands = await api.commands.getAll();
  if (commands.find(command => command.name === CLOSE_MULTI_COMMAND)?.shortcut !==
      OLD_DEFAULT_CLOSE_SHORTCUT) return false;
  if (commands.some(command => command.name !== CLOSE_MULTI_COMMAND &&
      command.shortcut === DEFAULT_CLOSE_SHORTCUT)) return false;
  await api.commands.update({
    name: CLOSE_MULTI_COMMAND,
    shortcut: DEFAULT_CLOSE_SHORTCUT,
  });
  return true;
}
