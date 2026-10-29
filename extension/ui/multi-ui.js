import { DEFAULT_MULTI_TARGETS, MAX_MULTI_TARGETS, normalizeMultiTargets } from "../core/multi-search.js";
import { MAX_AUTO_CLOSE_SECONDS, normalizeAutoCloseSeconds } from "../core/multi-sessions.js";
const labels = {
  ru: { heading: "Мультипоиск — окна плиткой", help: "F2 или значок возле выделенного текста. Сайты получают один и тот же запрос.",
    run: "Искать выделенное", add: "Добавить сайт", remove: "Удалить", reset: "Вернуть 4 поисковика",
    auto: "Автозакрытие через (секунд, 0 — выключено)", closeAll: "Закрыть все окна мультипоиска",
    badSeconds: "Введите целое число от 0 до 86400.",
    url: "HTTPS-адрес с {query}", empty: "Выбери текст на странице.", safe: "Только HTTPS и {query}. Окна распределяются по экрану; если места мало, часть не откроется." },
  en: { heading: "Multi-search — tiled windows", help: "F2 or the icon beside selected text. Every selected site receives the query.",
    run: "Search selection", add: "Add website", remove: "Remove", reset: "Restore 4 defaults",
    auto: "Auto-close after (seconds; 0 = off)", closeAll: "Close all multi-search windows",
    badSeconds: "Enter a whole number from 0 to 86400.",
    url: "HTTPS URL with {query}", empty: "Select text on a webpage first.", safe: "HTTPS and {query} only. Windows tile across the screen; too-small screens open fewer windows." },
};
const choices = ["google", "yandex", "bing", "duckduckgo", "custom"];
const names = { google: "Google", yandex: "Yandex", bing: "Bing", duckduckgo: "DuckDuckGo", custom: "Custom URL / Свой URL" };
export function initMultiUI(getLanguage, notify) {
  const workspace = document.querySelector(".workspace");
  const section = document.createElement("section");
  section.className = "multi-settings";
  workspace.after(section);
  const style = document.createElement("link");
  style.rel = "stylesheet";
  style.href = "multi.css";
  document.head.append(style);
  let targets = normalizeMultiTargets(undefined);
  let autoSeconds = 0;
  let save = Promise.resolve();
  const txt = () => labels[getLanguage()] || labels.en;
  function store() {
    const copy = targets.map(x => ({ ...x }));
    save = save.catch(() => {}).then(() => browser.storage.local.set({ multiTargets: copy }));
    save.catch(error => notify(String(error), true));
  }
  function render() {
    const t = txt();
    section.replaceChildren();
    const header = document.createElement("h2");
    header.textContent = t.heading;
    const hint = document.createElement("p");
    hint.textContent = t.help;
    section.append(header, hint);
    const list = document.createElement("div");
    list.className = "multi-list";
    targets.forEach((target, i) => {
      const row = document.createElement("div");
      row.className = "multi-row";
      const select = document.createElement("select");
      select.setAttribute("aria-label", "Search engine " + (i + 1));
      choices.forEach(id => {
        const option = document.createElement("option");
        option.value = id; option.textContent = names[id];
        select.append(option);
      });
      select.value = target.engine;
      const input = document.createElement("input");
      input.type = "url"; input.placeholder = t.url;
      input.setAttribute("aria-label", t.url);
      input.value = target.template || "";
      input.hidden = target.engine !== "custom";
      select.addEventListener("change", () => {
        targets[i] = select.value === "custom" ?
          { engine: "custom", template: "https://example.com/search?q={query}" } : { engine: select.value };
        store(); render();
      });
      input.addEventListener("change", () => {
        const candidate = normalizeMultiTargets([{ engine: "custom", template: input.value }]);
        if (candidate.length) { targets[i] = candidate[0]; store(); input.setCustomValidity(""); }
        else { input.setCustomValidity(t.safe); input.reportValidity(); }
      });
      const remove = document.createElement("button");
      remove.type = "button"; remove.textContent = "×"; remove.title = t.remove;
      remove.setAttribute("aria-label", t.remove + " " + (i + 1));
      remove.addEventListener("click", () => { targets.splice(i, 1); store(); render(); });
      row.append(select, input, remove); list.append(row);
    });
    section.append(list);
    const controls = document.createElement("div");
    controls.className = "multi-controls";
    const add = document.createElement("button");
    add.type = "button"; add.textContent = "+ " + t.add;
    add.disabled = targets.length >= MAX_MULTI_TARGETS;
    add.addEventListener("click", () => { targets.push({ engine: "google" }); store(); render(); });
    const reset = document.createElement("button");
    reset.type = "button"; reset.textContent = t.reset;
    reset.addEventListener("click", () => {
      targets = DEFAULT_MULTI_TARGETS.map(x => ({ ...x })); store(); render();
    });
    const run = document.createElement("button");
    run.type = "button"; run.className = "multi-run"; run.textContent = t.run;
    run.addEventListener("click", () => browser.runtime.sendMessage({ action: "multiSearchActive" })
      .then(result => { if (!result?.opened) notify(t.empty, true); })
      .catch(error => notify(String(error), true)));
    controls.append(add, reset, run);
    const warning = document.createElement("p");
    warning.textContent = t.safe;
    const closeAll = document.createElement("button");
    closeAll.type = "button"; closeAll.textContent = t.closeAll;
    closeAll.addEventListener("click", () =>
      browser.runtime.sendMessage({ action: "multiCloseAllManaged" })
        .catch(error => notify(String(error), true)));
    controls.append(closeAll);
    const autoLabel = document.createElement("label");
    autoLabel.className = "multi-auto";
    const autoText = document.createElement("span");
    autoText.textContent = t.auto;
    const autoInput = document.createElement("input");
    autoInput.type = "number"; autoInput.min = "0";
    autoInput.max = String(MAX_AUTO_CLOSE_SECONDS); autoInput.step = "1";
    autoInput.value = String(autoSeconds);
    autoInput.setAttribute("aria-label", t.auto);
    autoInput.addEventListener("input", () => {
      const value = Number(autoInput.value);
      if (autoInput.value.trim() && Number.isSafeInteger(value) &&
          value >= 0 && value <= MAX_AUTO_CLOSE_SECONDS) {
        autoSeconds = value;
        void browser.storage.local.set({ multiAutoCloseSeconds: autoSeconds })
          .catch(error => notify(String(error), true));
      }
    });
    autoInput.addEventListener("change", () => {
      if (autoInput.value.trim() === "") {
        autoSeconds = 0;
        autoInput.value = "0";
        void browser.storage.local.set({ multiAutoCloseSeconds: 0 })
          .catch(error => notify(String(error), true));
      } else if (!autoInput.checkValidity()) {
        notify(t.badSeconds, true);
        autoInput.value = String(autoSeconds);
      }
    });
    autoLabel.append(autoText, autoInput);
    section.append(controls, autoLabel, warning);
  }
  browser.storage.local.get(["multiTargets", "multiAutoCloseSeconds"]).then(settings => {
    targets = normalizeMultiTargets(settings.multiTargets);
    autoSeconds = normalizeAutoCloseSeconds(settings.multiAutoCloseSeconds); render();
  }).catch(error => notify(String(error), true));
  document.querySelectorAll("[data-lang]").forEach(button =>
    button.addEventListener("click", () => queueMicrotask(render)));
  browser.storage.onChanged.addListener((changes, area) => {
    if (area !== "local" || section.contains(document.activeElement)) return;
    if (changes.multiTargets) targets = normalizeMultiTargets(changes.multiTargets.newValue);
    if (changes.multiAutoCloseSeconds) {
      autoSeconds = normalizeAutoCloseSeconds(changes.multiAutoCloseSeconds.newValue);
    }
    if (changes.multiTargets || changes.multiAutoCloseSeconds) render();
  });
}
