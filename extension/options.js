import { buildSearchUrl, defaultProfile, firstFreeSlot, initialProfiles, normalizeProfiles, SEARCH_ENGINES, SLOT_IDS } from "./core/profiles.js";
import { applyLanguage, translate } from "./ui/i18n.js";
import { assignShortcut, shortcutFromEvent } from "./ui/shortcuts.js";
import { setupIconPicker } from "./ui/icon-picker.js";

const $ = id => document.getElementById(id);
const isMac = /Mac/i.test(navigator.platform);
let profiles = [];
let commands = [];
let selectedId = null;
let recordingId = null;
let language = "ru";
let saveChain = Promise.resolve();

function t(key) { return translate(language, key); }
function notify(message, error = false) {
  const box = $("status");
  box.textContent = t(message) === message ? message : t(message);
  box.classList.toggle("error", error);
}
function activeProfile() { return profiles.find(profile => profile.id === selectedId); }
function shortcutOf(id) { return commands.find(command => command.name === id)?.shortcut ?? ""; }
function labelOf(profile) {
  const engine = SEARCH_ENGINES[profile.engine]?.name ?? t("customEngine").replace("...", "");
  const title = profile.name.trim() || engine;
  return title;
}
function saveProfiles() {
  const snapshot = profiles.map(profile => ({ ...profile }));
  saveChain = saveChain.catch(() => {}).then(() => browser.storage.local.set({ profiles: snapshot }));
  saveChain.catch(error => notify(String(error), true));
  return saveChain;
}
async function loadCommands() { commands = await browser.commands.getAll(); }

function renderTabs() {
  const tabs = $("tabs");
  tabs.replaceChildren();
  for (const profile of profiles) {
    const tab = document.createElement("button");
    tab.type = "button";
    tab.className = "profile-tab";
    tab.role = "tab";
    tab.setAttribute("aria-selected", String(profile.id === selectedId));
    tab.setAttribute("tabindex", profile.id === selectedId ? "0" : "-1");
    tab.id = `tab-${profile.id}`;
    tab.title = `${labelOf(profile)} · ${profile.target === "foreground" ? t("modeForeground") : t("modeBackground")}`;
    const name = document.createElement("span");
    name.textContent = labelOf(profile);
    const key = document.createElement("kbd");
    key.textContent = shortcutOf(profile.id) || "—";
    tab.append(name, key);
    tab.addEventListener("click", () => { cancelRecording(); selectedId = profile.id; render(); });
    tabs.append(tab);
  }
  $("addProfile").disabled = profiles.length >= SLOT_IDS.length;
  $("counter").textContent = `${profiles.length} / ${SLOT_IDS.length}`;
}
function renderEditor() {
  const profile = activeProfile();
  $("emptyState").hidden = Boolean(profile);
  $("profileControls").hidden = !profile;
  if (!profile) return;
  $("editor").setAttribute("aria-labelledby", `tab-${profile.id}`);
  $("profileHeading").textContent = labelOf(profile);
  $("profileName").value = profile.name;
  $("engine").value = profile.engine;
  $("templateRow").hidden = profile.engine !== "custom";
  $("customTemplate").value = profile.template;
  for (const radio of document.querySelectorAll('[name="target"]')) {
    radio.checked = radio.value === profile.target;
  }
  $("shortcutLabel").textContent = recordingId === profile.id ? t("pressKey") :
    (shortcutOf(profile.id) || t("emptyKey"));
  $("clearShortcut").disabled = !shortcutOf(profile.id);
}
function render() { applyLanguage(language); renderTabs(); renderEditor(); }
function cancelRecording() { recordingId = null; renderEditor(); }

async function addProfile() {
  const slot = firstFreeSlot(profiles);
  if (!slot) { notify("tooMany", true); return; }
  cancelRecording();
  profiles.push(defaultProfile(slot));
  selectedId = slot;
  render();
  $("profileName").focus();
  await saveProfiles();
  notify("profileCreated");
}
async function removeProfile() {
  if (!selectedId || !confirm(t("confirmDelete"))) return;
  const id = selectedId;
  try {
    await assignShortcut(browser, id, "");
    profiles = profiles.filter(profile => profile.id !== id);
    selectedId = profiles[0]?.id ?? null;
    recordingId = null;
    await loadCommands();
    render();
    await saveProfiles();
    notify("profileDeleted");
  } catch (error) { notify(String(error), true); }
}
async function changeShortcut(id, value) {
  try {
    await assignShortcut(browser, id, value);
    recordingId = null;
    await loadCommands();
    render();
    notify(value ? "configured" : "removed");
  } catch (error) {
    notify(["conflicting", "unsupported", "needsModifier"].includes(error.message) ? error.message :
      String(error), true);
  }
}

$("addProfile").addEventListener("click", () => void addProfile());
$("removeProfile").addEventListener("click", () => void removeProfile());
$("profileName").addEventListener("input", event => {
  const profile = activeProfile();
  if (!profile) return;
  profile.name = event.target.value.slice(0, 40);
  renderTabs();
  $("profileHeading").textContent = labelOf(profile);
});
$("profileName").addEventListener("change", () => void saveProfiles());
$("engine").addEventListener("change", event => {
  const profile = activeProfile();
  if (!profile) return;
  profile.engine = event.target.value;
  render();
  void saveProfiles();
});
$("customTemplate").addEventListener("change", event => {
  const profile = activeProfile();
  if (!profile) return;
  try {
    buildSearchUrl({ ...profile, template: event.target.value }, "test");
    profile.template = event.target.value;
    void saveProfiles();
    notify("saved");
  } catch { notify("invalidTemplate", true); }
});
for (const radio of document.querySelectorAll('[name="target"]')) {
  radio.addEventListener("change", () => {
    const profile = activeProfile();
    if (!profile || !radio.checked) return;
    profile.target = radio.value;
    renderTabs();
    void saveProfiles();
  });
}
$("recordShortcut").addEventListener("click", () => {
  recordingId = selectedId;
  renderEditor();
  $("recordShortcut").focus();
});
$("clearShortcut").addEventListener("click", () => {
  if (selectedId) void changeShortcut(selectedId, "");
});
document.addEventListener("keydown", event => {
  if (!recordingId) return;
  if (event.key === "Tab" && !event.ctrlKey && !event.altKey && !event.metaKey) {
    cancelRecording(); return;
  }
  event.preventDefault();
  event.stopImmediatePropagation();
  if (event.key === "Escape") { cancelRecording(); notify("cancelled"); return; }
  if (event.repeat) return;
  try {
    const shortcut = shortcutFromEvent(event, isMac);
    if (shortcut) void changeShortcut(recordingId, shortcut);
  } catch (error) { notify(error.message, true); }
}, true);
document.addEventListener("pointerdown", event => {
  if (recordingId && !$("recordShortcut").contains(event.target)) cancelRecording();
}, true);
for (const button of document.querySelectorAll("[data-lang]")) {
  button.addEventListener("click", async () => {
    language = button.dataset.lang;
    render();
    try { await browser.storage.local.set({ uiLanguage: language }); }
    catch (error) { notify(String(error), true); }
  });
}
$("tabs").addEventListener("keydown", event => {
  if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key) || !profiles.length) return;
  event.preventDefault();
  const index = profiles.findIndex(profile => profile.id === selectedId);
  const next = event.key === "Home" ? 0 : event.key === "End" ? profiles.length - 1 :
    (index + (event.key === "ArrowLeft" ? -1 : 1) + profiles.length) % profiles.length;
  selectedId = profiles[next].id;
  render();
  $(`tab-${selectedId}`).focus();
});
$("browserShortcuts").addEventListener("click", () =>
  void browser.commands.openShortcutSettings().catch(error => notify(String(error), true)));
browser.commands.onChanged.addListener(() => void loadCommands().then(render));
window.addEventListener("focus", () => { if (!recordingId) void loadCommands().then(render); });
setupIconPicker(browser, notify);

void (async () => {
  const settings = await browser.storage.local.get(["profiles", "searchEngine", "uiLanguage"]);
  language = ["ru", "en"].includes(settings.uiLanguage) ? settings.uiLanguage :
    (browser.i18n.getUILanguage().toLowerCase().startsWith("ru") ? "ru" : "en");
  await loadCommands();
  const stored = normalizeProfiles(settings.profiles);
  profiles = stored ?? initialProfiles(settings.searchEngine, commands);
  if (!stored) await saveProfiles();
  selectedId = profiles[0]?.id ?? null;
  render();
})().catch(error => notify(String(error), true));
