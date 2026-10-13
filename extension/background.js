import { searchByCommand } from "./core/search.js";
import { applyToolbarIcon } from "./core/icon.js";

browser.commands.onCommand.addListener((command, tab) => {
  void searchByCommand(browser, command, tab).catch(error =>
    console.warn("Fast Search: search failed", error));
});

browser.action.onClicked.addListener(() => void browser.runtime.openOptionsPage());

browser.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.toolbarIcon) {
    void applyToolbarIcon(browser, changes.toolbarIcon.newValue).catch(console.warn);
  }
});

void browser.storage.local.get("toolbarIcon").then(settings =>
  settings.toolbarIcon && applyToolbarIcon(browser, settings.toolbarIcon)).catch(console.warn);
