import { searchByCommand, searchSelectionFromIcon } from "./core/search.js";

browser.commands.onCommand.addListener((command, tab) => {
  void searchByCommand(browser, command, tab).catch(error =>
    console.warn("Fast Search: search failed", error));
});


browser.runtime.onMessage.addListener((message, sender) => {
  if (message?.type !== "fast-search:selection-icon" ||
      typeof message.text !== "string" || !Number.isInteger(sender.tab?.id)) return;
  return searchSelectionFromIcon(browser, message.text, sender.tab).catch(error => {
    console.warn("Fast Search: selection icon search failed", error);
    return false;
  });
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
