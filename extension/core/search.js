import { buildSearchUrl, initialProfiles, normalizeProfiles } from "./profiles.js";
import { preferFocusedSelection, readSelection } from "./selection.js";

async function querySelection(api, tabId, allFrames) {
  return api.scripting.executeScript({ target: { tabId, allFrames }, func: readSelection });
}

export async function searchByCommand(api, commandName, suppliedTab) {
  const settings = await api.storage.local.get(["profiles", "searchEngine"]);
  const commands = settings.profiles === undefined ? await api.commands.getAll() : [];
  const profiles = normalizeProfiles(settings.profiles) ?? initialProfiles(settings.searchEngine, commands);
  const profile = profiles.find(item => item.id === commandName);
  if (!profile) return false;
  const tab = Number.isInteger(suppliedTab?.id) ? suppliedTab :
    (await api.tabs.query({ active: true, lastFocusedWindow: true }))[0];
  if (!Number.isInteger(tab?.id)) return false;

  let result;
  try {
    result = await querySelection(api, tab.id, true);
  } catch {
    try { result = await querySelection(api, tab.id, false); }
    catch { return false; } // about:, internal Firefox pages and blocked frames.
  }
  const url = buildSearchUrl(profile, preferFocusedSelection(result));
  if (!url) return false;
  await api.tabs.create({
    url,
    active: profile.target === "foreground",
    windowId: tab.windowId,
    index: tab.index + 1,
    openerTabId: tab.id,
  });
  return true;
}
