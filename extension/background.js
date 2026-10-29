import { openMultiSearch, MULTI_COMMAND } from "./core/multi-search.js";
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
  return undefined;
});
