// Runs in isolated content-script world on webpages, not inside extension settings.
(function () {
  "use strict";
  const { normalizeAngle, position, DEFAULT_ANGLE } = globalThis.FastSearchIconPlacement;
  let enabled = false; // Do not display anything before reading the saved preference.
  let angle = DEFAULT_ANGLE;
  let selectedText = "";
  let pointerSelecting = false;
  let updatePending = false;

  const host = document.createElement("div");
  host.setAttribute("data-fast-search-button", "");
  host.style.cssText = "position:fixed;left:0;top:0;z-index:2147483647;display:none;" +
    "width:36px;height:36px;pointer-events:auto;";
  const shadow = host.attachShadow({ mode: "closed" });
  const style = document.createElement("style");
  style.textContent = [
    ":host{all:initial}",
    "button{all:initial;box-sizing:border-box;display:grid;place-items:center;",
    "width:36px;height:36px;border-radius:12px;cursor:pointer;",
    "background:#a58af7;color:#171027;border:1px solid #e0d4ff;",
    "box-shadow:0 4px 16px #0005;font-family:system-ui,sans-serif;}",
    "button:hover{background:#c5b4ff;transform:scale(1.06)}",
    "button:focus-visible{outline:3px solid #4f38a1;outline-offset:2px}",
    "svg{width:20px;height:20px;display:block;fill:none;stroke:currentColor;",
    "stroke-width:2;stroke-linecap:round;stroke-linejoin:round}",
  ].join("");
  const button = document.createElement("button");
  button.type = "button";
  const tooltip = /^ru\b/i.test(browser.i18n.getUILanguage())
    ? "Найти выделенный текст" : "Search selected text";
  button.setAttribute("aria-label", tooltip);
  button.title = tooltip;
  button.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true">' +
    '<circle cx="10.5" cy="10.5" r="6.5"></circle><path d="m16 16 5 5"></path></svg>';
  shadow.append(style, button);
  document.documentElement.append(host);

  function hide() {
    host.style.display = "none";
    selectedText = "";
  }

  function currentSelection() {
    let element = document.activeElement;
    while (element?.shadowRoot?.activeElement) element = element.shadowRoot.activeElement;
    const input = element?.tagName === "TEXTAREA" ||
      (element?.tagName === "INPUT" && ["text", "search", "url", "tel"].includes(element.type));
    if (input && typeof element.selectionStart === "number") {
      if (element.selectionStart === element.selectionEnd) return null;
      return {
        text: element.value.slice(element.selectionStart, element.selectionEnd),
        rect: element.getBoundingClientRect(),
      };
    }
    const selection = element?.getRootNode?.().getSelection?.() ||
      window.getSelection();
    if (!selection || selection.isCollapsed || !selection.rangeCount) return null;
    const range = selection.getRangeAt(0);
    const rects = [...range.getClientRects()].filter(rect => rect.width > 0 && rect.height > 0);
    return {
      text: selection.toString(),
      rect: rects.at(-1) || range.getBoundingClientRect(),
    };
  }

  function update() {
    if (!enabled || pointerSelecting || !document.hasFocus()) { hide(); return; }
    const selection = currentSelection();
    const text = selection?.text?.trim();
    const rect = selection?.rect;
    if (!text || !rect?.width || !rect?.height ||
        rect.bottom < 0 || rect.top > innerHeight ||
        rect.right < 0 || rect.left > innerWidth) {
      hide();
      return;
    }
    selectedText = text.slice(0, 2048);
    const point = position(rect, angle, innerWidth, innerHeight);
    host.style.left = point.left + "px";
    host.style.top = point.top + "px";
    host.style.display = "block";
  }

  function scheduleUpdate() {
    if (updatePending) return;
    updatePending = true;
    requestAnimationFrame(() => {
      updatePending = false;
      update();
    });
  }

  button.addEventListener("pointerdown", event => {
    event.preventDefault(); // Keep the webpage's text selection when clicking.
    event.stopPropagation();
  });
  button.addEventListener("click", event => {
    event.preventDefault();
    event.stopPropagation();
    const text = selectedText;
    hide();
    if (text) void browser.runtime.sendMessage({ type: "fast-search:selection-icon", text })
      .catch(error => console.warn("Fast Search: could not search selection", error));
  });

  document.addEventListener("pointerdown", event => {
    if (event.composedPath().includes(host)) return;
    pointerSelecting = true;
    hide();
  }, true);
  window.addEventListener("pointerup", () => {
    pointerSelecting = false;
    scheduleUpdate();
  }, true);
  window.addEventListener("pointercancel", () => {
    pointerSelecting = false;
    scheduleUpdate();
  }, true);
  document.addEventListener("selectionchange", scheduleUpdate);
  document.addEventListener("keyup", scheduleUpdate, true);
  document.addEventListener("scroll", scheduleUpdate, true);
  window.addEventListener("resize", scheduleUpdate);
  window.addEventListener("blur", hide);

  browser.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") return;
    if (changes.selectionIconEnabled) enabled = changes.selectionIconEnabled.newValue !== false;
    if (changes.selectionIconAngle) angle = normalizeAngle(changes.selectionIconAngle.newValue);
    if (changes.selectionIconEnabled || changes.selectionIconAngle) {
      if (enabled) scheduleUpdate();
      else hide();
    }
  });
  void browser.storage.local.get(["selectionIconEnabled", "selectionIconAngle"])
    .then(settings => {
      enabled = settings.selectionIconEnabled !== false;
      angle = normalizeAngle(settings.selectionIconAngle);
      scheduleUpdate();
    }).catch(error => console.warn("Fast Search: icon settings unavailable", error));
})();
