import { openMultiSearch, MULTI_COMMAND } from "./core/multi-search.js";
import { ALARM_PREFIX, closeAllMultiSessions, closeMultiSession,
  forgetMultiWindow, multiSessionForWindow } from "./core/multi-sessions.js";
import { searchByCommand } from "./core/search.js";

browser.commands.onCommand.addListener((command, tab) => {
  void (command === MULTI_COMMAND ? openMultiSearch(browser, { tab }) : searchByCommand(browser, command, tab)).catch(error =>
    console.warn("Fast Search: search failed", error));
});

// Remove any icon uploaded in older versions. Only the bundled icon is supported.
void (async () => {
  try {
    await browser.storage.local.remove("toolbarIcon");
    await browser.action.setIcon({ path: "icons/icon.png" });
  } catch (error) {
    console.warn("Fast Search: could not reset the legacy toolbar icon", error);
  }
})();

browser.runtime.onMessage.addListener((message, sender) => {
  if (message?.action === "multiSearch" && Number.isInteger(sender.tab?.id)) {
    return openMultiSearch(browser, { tab: sender.tab,
      selectedText: message.text, screenBounds: message.screenBounds });
  }
  if (message?.action === "multiSearchActive") return openMultiSearch(browser);
  if (message?.action === "multiSessionInfo") {
    return multiSessionForWindow(browser, sender.tab?.windowId);
  }
  if (message?.action === "multiCloseGroup" && Number.isInteger(sender.tab?.windowId)) {
    return closeMultiSession(browser, message.id, sender.tab.windowId);
  }
  if (message?.action === "multiCloseAllManaged" &&
      sender.url?.startsWith(browser.runtime.getURL(""))) {
    return closeAllMultiSessions(browser);
  }
  return undefined;
});

browser.alarms.onAlarm.addListener(alarm => {
  if (!alarm.name.startsWith(ALARM_PREFIX)) return;
  void closeMultiSession(browser, alarm.name.slice(ALARM_PREFIX.length)).catch(error =>
    console.warn("Fast Search: auto-close failed", error));
});
browser.windows.onRemoved.addListener(windowId => {
  void forgetMultiWindow(browser, windowId).catch(error =>
    console.warn("Fast Search: multi-search cleanup failed", error));
});
