const ENGINES = {
  google: ["https://www.google.com/search", "q"],
  duckduckgo: ["https://duckduckgo.com/", "q"],
  yandex: ["https://yandex.ru/search/", "text"],
  bing: ["https://www.bing.com/search", "q"],
};
const MODES = {"search-foreground": true, "search-background": false};

function selectText() {
  let element = document.activeElement;
  while (element?.shadowRoot?.activeElement) element = element.shadowRoot.activeElement;
  if (element?.tagName === "TEXTAREA" ||
      (element?.tagName === "INPUT" && ["text", "search", "url", "tel"].includes(element.type))) {
    return {text: element.value.slice(element.selectionStart, element.selectionEnd),
      focused: document.hasFocus()};
  }
  return {text: window.getSelection()?.toString() || "", focused: document.hasFocus()};
}

async function search(tab, foreground) {
  const source = Number.isInteger(tab?.id) ? tab :
    (await browser.tabs.query({active: true, lastFocusedWindow: true}))[0];
  if (!Number.isInteger(source?.id)) return;
  let results;
  try {
    results = await browser.scripting.executeScript({
      target: {tabId: source.id, allFrames: true}, func: selectText
    });
  } catch (error) {
    console.info("Fast Search: cannot read selection on this page", error);
    return;
  }
  const frames = results.map(({result}) => result).filter(value => value?.text?.trim());
  const text = (frames.find(value => value.focused) ?? frames[0])?.text
    ?.replace(/\s+/gu, " ").trim().slice(0, 2048);
  if (!text) return;
  const settings = await browser.storage.local.get("searchEngine");
  const [base, parameter] = ENGINES[settings.searchEngine] ?? ENGINES.google;
  const url = new URL(base);
  url.searchParams.set(parameter, text);
  await browser.tabs.create({url: url.toString(), active: foreground,
    windowId: source.windowId, index: source.index + 1, openerTabId: source.id});
}

browser.commands.onCommand.addListener((name, tab) => {
  if (Object.hasOwn(MODES, name))
    void search(tab, MODES[name]).catch(console.error);
});
browser.action.onClicked.addListener(() => void browser.runtime.openOptionsPage());
