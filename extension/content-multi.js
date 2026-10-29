// The on-page icon never sends selected text until the user clicks it.
let icon;
let lastText = "";
let lastRect;
function removeMultiIcon() { icon?.remove(); icon = null; }
document.addEventListener("mouseup", event => {
  if (event.button !== 0 || icon?.contains(event.target)) return;
  removeMultiIcon();
  const selection = window.getSelection();
  const text = selection?.toString().trim() || "";
  if (!text || text.length > 2048 || !selection.rangeCount) return;
  if (event.target?.closest?.("input,textarea,[contenteditable],button,select")) return;
  lastText = text;
  lastRect = selection.getRangeAt(0).getBoundingClientRect();
  icon = document.createElement("button");
  icon.type = "button";
  icon.textContent = "⌕";
  icon.title = "Fast Search — search in multiple windows";
  icon.setAttribute("aria-label", icon.title);
  icon.style.cssText = "position:fixed;z-index:2147483647;width:28px;height:28px;" +
    "background:#302844;color:white;border:1px solid #a58af7;border-radius:8px;" +
    "box-shadow:0 2px 8px #0005;font-size:24px;cursor:pointer;line-height:20px;";
  icon.style.left = Math.max(0, Math.min(innerWidth - 30, lastRect.right + 6)) + "px";
  icon.style.top = Math.max(0, Math.min(innerHeight - 30, lastRect.top)) + "px";
  icon.addEventListener("mousedown", e => { e.preventDefault(); e.stopPropagation(); });
  icon.addEventListener("click", e => {
    e.preventDefault(); e.stopPropagation();
    const screenBounds = { left: screen.availLeft, top: screen.availTop,
      width: screen.availWidth, height: screen.availHeight };
    browser.runtime.sendMessage({ action: "multiSearch", text: lastText, screenBounds })
      .catch(error => console.warn("Fast Search:", error));
    removeMultiIcon();
  });
  document.documentElement.append(icon);
}, true);
document.addEventListener("mousedown", e => {
  if (icon && !icon.contains(e.target)) removeMultiIcon();
}, true);
document.addEventListener("keydown", e => { if (e.key === "Escape") removeMultiIcon(); }, true);
window.addEventListener("scroll", removeMultiIcon, true);

let closeAllHost = null;
let managedSessionId = null;
let autoCloseTimer = null;

// Render inside shadow DOM to isolate the control from search websites' styles.
function displayMultiClose(session) {
  if (!session?.id || managedSessionId === session.id) return;
  closeAllHost?.remove();
  if (autoCloseTimer !== null) clearTimeout(autoCloseTimer);
  managedSessionId = session.id;
  const russian = session.language === "ru";
  const host = document.createElement("div");
  host.style.cssText = "position:fixed!important;top:8px!important;left:50%!important;" +
    "transform:translateX(-50%)!important;z-index:2147483647!important;" +
    "pointer-events:auto!important;";
  const root = host.attachShadow({ mode: "closed" });
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = russian ? "✕ Закрыть все" : "✕ Close all";
  button.title = russian ? "Закрыть окна этого мультипоиска" : "Close this multi-search group";
  button.style.cssText = "all:initial;display:block;cursor:pointer;" +
    "padding:8px 16px;border-radius:999px;border:1px solid #c3b1ff;" +
    "background:rgba(23,21,36,.93);color:#fff;font:600 13px system-ui,sans-serif;" +
    "box-shadow:0 3px 14px #0005;text-align:center;white-space:nowrap;";
  button.addEventListener("click", event => {
    event.preventDefault();
    event.stopPropagation();
    button.disabled = true;
    browser.runtime.sendMessage({ action: "multiCloseGroup", id: session.id })
      .then(closed => { if (!closed) button.disabled = false; })
      .catch(() => { button.disabled = false; });
  });
  root.append(button);
  document.documentElement.append(host);
  closeAllHost = host;
  const expiresAt = Number(session.expiresAt);
  if (Number.isFinite(expiresAt) && expiresAt > 0) {
    const remaining = Math.max(0, expiresAt - Date.now());
    button.title += russian ?
      " · Автозакрытие через " + Math.ceil(remaining / 1000) + " сек." :
      " · Auto-close in " + Math.ceil(remaining / 1000) + " sec.";
    autoCloseTimer = setTimeout(() => {
      browser.runtime.sendMessage({ action: "multiCloseGroup", id: session.id }).catch(() => {});
    }, remaining);
  }
}

async function refreshMultiClose() {
  try {
    const session = await browser.runtime.sendMessage({ action: "multiSessionInfo" });
    if (session) displayMultiClose(session);
  } catch { /* The extension may be reloading or this page may be restricted. */ }
}
browser.runtime.onMessage.addListener(message => {
  if (message?.action === "multiSessionReady") void refreshMultiClose();
});
// Covers navigation and fast-loading pages that finish before a batch is registered.
void refreshMultiClose();
