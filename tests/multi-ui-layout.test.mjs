import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { initMultiUI } from "../extension/ui/multi-ui.js";

class Element {
  constructor(tag) { this.tag = tag; this.children = []; this.listeners = new Map(); }
  append(...items) { this.children.push(...items); }
  replaceChildren(...items) { this.children = items; }
  after(item) { this.next = item; }
  addEventListener(type, handler) { this.listeners.set(type, handler); }
  setAttribute(name, value) { this[name] = value; }
  click() { this.listeners.get("click")?.(); }
}
const all = (element, tag) => [
  ...(element.tag === tag ? [element] : []),
  ...element.children.flatMap(child => all(child, tag)),
];

async function renderPopup(isFullSettings, lang = "en") {
  const workspace = new Element("section");
  const controls = { granted: [], messages: [] };
  const documentMock = {
    head: new Element("head"),
    createElement: tag => new Element(tag),
    querySelector: () => workspace,
    querySelectorAll: () => [],
    getElementById: id => id === "fullSettings" && !isFullSettings ? new Element("button") : null,
    addEventListener: () => {},
  };
  const browserMock = {
    commands: { getAll: async () => [{ name: "close-multi-search", shortcut: "Ctrl+Alt+F2" }],
      onChanged: { addListener: () => {} } },
    storage: { local: { get: async () => ({}) }, onChanged: { addListener: () => {} } },
    runtime: { sendMessage: message => { controls.messages.push(message); return Promise.resolve({}); } },
    permissions: { request: options => { controls.granted.push(options); return Promise.resolve(true); } },
  };
  const original = ["document", "window", "navigator", "browser"].map(name =>
    [name, Object.getOwnPropertyDescriptor(globalThis, name)]);
  try {
    Object.defineProperties(globalThis, {
      document: { configurable: true, writable: true, value: documentMock },
      window: { configurable: true, writable: true, value: { addEventListener: () => {} } },
      navigator: { configurable: true, writable: true, value: { platform: "Win32" } },
      browser: { configurable: true, writable: true, value: browserMock },
    });
    initMultiUI(() => lang, () => {});
    await new Promise(resolve => setImmediate(resolve));
    const buttons = all(workspace.next, "button");
    const names = buttons.map(button => button.textContent);
    assert.ok(names.includes(lang === "ru" ? "Закрыть все окна мультипоиска"
      : "Close all multi-search windows"));
    assert.ok(!names.includes("Search selection"));
    assert.ok(!names.includes("Искать выделенное"));
    const permission = buttons.find(button => button.textContent ===
      (lang === "ru" ? "Разрешить кнопки «Закрыть все» на поисковиках"
        : "Enable Close all buttons on search engines"));
    assert.equal(Boolean(permission), isFullSettings);
    if (permission) {
      permission.click();
      assert.equal(controls.granted.length, 1);
      assert.equal(controls.granted[0].origins.length, 4);
    } else assert.equal(controls.granted.length, 0);
    buttons.find(button => button.textContent ===
      (lang === "ru" ? "Закрыть все окна мультипоиска" : "Close all multi-search windows")).click();
    assert.deepEqual(controls.messages, [{ action: "multiCloseAllManaged" }]);
  } finally {
    for (const [name, descriptor] of original) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else delete globalThis[name];
    }
  }
}

test("popup retains Close all but never offers search or site permission", async () => {
  await renderPopup(false, "ru");
});
test("full settings exposes optional site permission, not redundant search", async () => {
  await renderPopup(true);
});

test("background has no obsolete multiSearchActive message handler", () => {
  const background = readFileSync(new URL("../extension/background.js", import.meta.url), "utf8");
  const ui = readFileSync(new URL("../extension/ui/multi-ui.js", import.meta.url), "utf8");
  assert.doesNotMatch(background, /multiSearchActive/);
  assert.doesNotMatch(ui, /multiSearchActive|multi-run|Search selection|Искать выделенное/);
  assert.match(ui, /const isFullSettings = document.getElementById\("fullSettings"\) === null/);
});

test("the bundled bilingual legal notice contains broad exclusions and mandatory-law limits", () => {
  const legal = readFileSync(new URL("../extension/legal.html", import.meta.url), "utf8");
  const disclaimer = readFileSync(new URL("../DISCLAIMER.md", import.meta.url), "utf8");
  const ru = legal.match(/<article data-legal-copy="ru" hidden>([\s\S]*?)<\/article>/)?.[1];
  const en = legal.match(/<article data-legal-copy="en" hidden>([\s\S]*?)<\/article>/)?.[1];
  assert.ok(ru && en);
  for (const article of [ru, en]) {
    assert.equal((article.match(/<section>/g) || []).length, 11);
    assert.match(article, /DISCLAIMER\.md/);
  }
  assert.match(ru, /МАКСИМАЛЬНЫХ ПРЕДЕЛАХ/);
  assert.match(ru, /НИЧТО В ЭТОМ ТЕКСТЕ НЕ ИСКЛЮЧАЕТ/);
  assert.match(en, /TO THE FULLEST EXTENT/);
  assert.match(en, /NOTHING IN THIS NOTICE EXCLUDES/);
  assert.match(disclaimer, /## English/);
  assert.match(disclaimer, /## Русский/);
});
