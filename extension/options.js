const COMMANDS = ["search-foreground", "search-background"];
const status = document.querySelector("#status");
const engine = document.querySelector("#engine");
let recording = null;

function notice(text, error = false) {
  status.textContent = text;
  status.classList.toggle("error", error);
}
async function refresh() {
  const commands = await browser.commands.getAll();
  for (const name of COMMANDS) {
    const shortcut = commands.find(item => item.name === name)?.shortcut || "";
    const target = document.querySelector('[data-key="' + name + '"]');
    target.textContent = shortcut || "Не назначено";
    target.dataset.saved = shortcut;
  }
}
async function assign(name, shortcut) {
  const commands = await browser.commands.getAll();
  if (shortcut && commands.some(item => item.name !== name && item.shortcut === shortcut)) {
    notice("Эта комбинация уже назначена другой команде.", true);
    return;
  }
  try {
    await browser.commands.update({name, shortcut});
    await refresh();
    notice(shortcut ? "Назначено: " + shortcut : "Комбинация удалена.");
  } catch (error) { notice(error.message, true); }
}
function cancel() {
  if (!recording) return;
  const target = document.querySelector('[data-key="' + recording + '"]');
  target.textContent = target.dataset.saved || "Не назначено";
  recording = null;
}
for (const button of document.querySelectorAll("[data-capture]")) {
  button.addEventListener("click", () => {
    cancel();
    recording = button.dataset.capture;
    button.querySelector("kbd").textContent = "Нажми клавиши…";
    notice("Введи комбинацию. Esc — отмена.");
  });
}
document.addEventListener("keydown", async event => {
  if (!recording) return;
  if (event.key === "Tab" && !event.ctrlKey && !event.altKey && !event.metaKey) {
    cancel(); return;
  }
  event.preventDefault();
  event.stopImmediatePropagation();
  if (event.key === "Escape") { cancel(); notice("Отменено."); return; }
  if (["Control", "Alt", "Shift", "Meta"].includes(event.key) || event.repeat) return;
  const code = event.code || "";
  let key = event.key;
  if (/^Key[A-Z]$/.test(code)) key = code.slice(3);
  else if (/^Digit[0-9]$/.test(code)) key = code.slice(5);
  else if (key.startsWith("Arrow")) key = key.slice(5);
  else if (key.length === 1) key = key.toUpperCase();
  const functionKey = /^F(?:[1-9]|1[0-9])$/.test(key);
  if (!functionKey && !/^[A-Z0-9]$/.test(key)) {
    notice("Клавиша не поддерживается Firefox.", true); return;
  }
  const mods = [event.ctrlKey && "Ctrl", event.altKey && "Alt",
    event.metaKey && "Command", event.shiftKey && "Shift"].filter(Boolean);
  if ((!functionKey && !mods.some(mod => mod !== "Shift")) || mods.length > 2) {
    notice("Нужно Ctrl/Alt/Command; максимум два модификатора.", true); return;
  }
  const name = recording;
  cancel();
  await assign(name, [...mods, key].join("+"));
}, true);
for (const button of document.querySelectorAll("[data-clear]")) {
  button.addEventListener("click", () => { cancel(); void assign(button.dataset.clear, ""); });
}
for (const button of document.querySelectorAll("[data-reset]")) {
  button.addEventListener("click", async () => {
    cancel();
    try {
      await browser.commands.reset(button.dataset.reset);
      await refresh();
      notice("Восстановлено.");
    } catch (error) { notice(error.message, true); }
  });
}
document.querySelector("#browser-shortcuts").addEventListener("click", () =>
  void browser.commands.openShortcutSettings().catch(error => notice(error.message, true)));
engine.addEventListener("change", async () => {
  try {
    await browser.storage.local.set({searchEngine: engine.value});
    notice("Поисковик сохранён.");
  } catch (error) { notice(error.message, true); }
});
browser.commands.onChanged.addListener(() => void refresh());
window.addEventListener("focus", () => { if (!recording) void refresh(); });
void (async () => {
  engine.value = (await browser.storage.local.get("searchEngine")).searchEngine || "google";
  await refresh();
})().catch(error => notice(error.message, true));
