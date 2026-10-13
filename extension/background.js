import { searchByCommand } from "./core/search.js";

browser.commands.onCommand.addListener((command, tab) => {
  void searchByCommand(browser, command, tab).catch(error =>
    console.warn("Fast Search: search failed", error));
});

browser.action.onClicked.addListener(() => void browser.runtime.openOptionsPage());

// Remove any icon uploaded in older versions. Only the bundled icon is supported.
void (async () => {
  try {
    await browser.storage.local.remove("toolbarIcon");
    await browser.action.setIcon({ path: "icons/icon.png" });
  } catch (error) {
    console.warn("Fast Search: could not reset the legacy toolbar icon", error);
  }
})();
