import { CLOSE_MULTI_COMMAND } from "../core/multi-sessions.js";
import { assignShortcut, shortcutFromEvent } from "./shortcuts.js";

const strings = {
  ru: {
    heading: "Горячая клавиша: закрыть все окна мультипоиска",
    hint: "Закрывает только окна, созданные мультипоиском, из любой вкладки Firefox.",
    capture: "Нажмите сочетание…",
    change: "Изменить",
    clear: "Убрать",
    empty: "Не назначено",
    saved: "Клавиша закрытия сохранена.",
    removed: "Клавиша закрытия отключена.",
    cancelled: "Настройка клавиши отменена.",
  },
  en: {
    heading: "Shortcut: close all multi-search windows",
    hint: "Closes only multi-search-created windows, from any Firefox tab.",
    capture: "Press shortcut…",
    change: "Change",
    clear: "Clear",
    empty: "Not assigned",
    saved: "Close shortcut saved.",
    removed: "Close shortcut cleared.",
    cancelled: "Shortcut capture cancelled.",
  },
};

// Shared by the toolbar popup and full settings view. Firefox owns the
// command assignment; no separate local shortcut override is necessary.
export function createCloseShortcutUI(api, getLanguage, notify) {
  const container = document.createElement("div");
  container.className = "multi-shortcut";
  const title = document.createElement("strong");
  const hint = document.createElement("p");
  const controls = document.createElement("div");
  controls.className = "multi-shortcut-controls";
  const record = document.createElement("button");
  record.type = "button";
  record.className = "multi-shortcut-record";
  const key = document.createElement("kbd");
  const change = document.createElement("span");
  record.append(key, change);
  const clear = document.createElement("button");
  clear.type = "button";
  clear.className = "multi-shortcut-clear";
  controls.append(record, clear);
  container.append(title, hint, controls);
  const isMac = /Mac/i.test(navigator.platform);
  let assigned = "";
  let recording = false;

  const t = () => strings[getLanguage()] || strings.en;
  const render = () => {
    const local = t();
    title.textContent = local.heading;
    hint.textContent = local.hint;
    key.textContent = recording ? local.capture : (assigned || local.empty);
    change.textContent = local.change;
    clear.textContent = local.clear;
    clear.disabled = recording || !assigned;
    record.setAttribute("aria-label", local.heading);
    record.setAttribute("aria-pressed", String(recording));
  };
  const refresh = async () => {
    const commands = await api.commands.getAll();
    assigned = commands.find(item => item.name === CLOSE_MULTI_COMMAND)?.shortcut || "";
    render();
  };
  const stopCapture = () => { recording = false; render(); };
  const update = async shortcut => {
    try {
      await assignShortcut(api, CLOSE_MULTI_COMMAND, shortcut);
      recording = false;
      await refresh();
      notify(shortcut ? t().saved : t().removed);
    } catch (error) {
      recording = false;
      render();
      notify(["conflicting", "unsupported", "needsModifier"].includes(error.message)
        ? error.message : String(error), true);
    }
  };

  record.addEventListener("click", () => {
    recording = true;
    render();
    record.focus();
  });
  clear.addEventListener("click", () => { void update(""); });
  document.addEventListener("keydown", event => {
    if (!recording) return;
    if (event.key === "Tab" && !event.ctrlKey && !event.altKey && !event.metaKey) {
      stopCapture();
      return;
    }
    event.preventDefault();
    event.stopImmediatePropagation();
    if (event.key === "Escape") {
      stopCapture();
      notify(t().cancelled);
      return;
    }
    if (event.repeat) return;
    try {
      const shortcut = shortcutFromEvent(event, isMac);
      if (shortcut) void update(shortcut);
    } catch (error) { notify(error.message, true); }
  }, true);
  document.addEventListener("pointerdown", event => {
    if (recording && !record.contains(event.target)) stopCapture();
  }, true);
  api.commands.onChanged.addListener(() => { void refresh().catch(error => notify(String(error), true)); });
  window.addEventListener("focus", () => { if (!recording) void refresh().catch(() => {}); });
  void refresh().catch(error => notify(String(error), true));
  return { container, render };
}
