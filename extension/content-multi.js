// Close-all buttons for multi-search sessions. The configurable selection icon lives in selection-icon.js.
let closeAllHost = null;
let managedSessionId = null;
let autoCloseTimer = null;
let sourceControl = false;
let showCloseButtons = true;

function clearMultiClose() {
  closeAllHost?.remove();
  closeAllHost = null;
  managedSessionId = null;
  sourceControl = false;
  if (autoCloseTimer !== null) clearTimeout(autoCloseTimer);
  autoCloseTimer = null;
}

// Render inside shadow DOM to isolate the control from search websites' styles.
function displayMultiClose(session, isSource = false) {
  if (!session?.id) return;
  if (managedSessionId === session.id) {
    if (isSource) sourceControl = true;
    return;
  }
  clearMultiClose();
  managedSessionId = session.id;
  sourceControl = isSource;
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
    const settings = await browser.storage.local.get("multiShowCloseButtons");
    showCloseButtons = settings.multiShowCloseButtons !== false;
    if (!showCloseButtons) {
      if (!sourceControl) clearMultiClose();
      return;
    }
    const session = await browser.runtime.sendMessage({ action: "multiSessionInfo" });
    if (showCloseButtons && session) displayMultiClose(session);
  } catch { /* The extension may be reloading or this page may be restricted. */ }
}
browser.storage.onChanged.addListener((changes, area) => {
  if (area !== "local" || !changes.multiShowCloseButtons) return;
  showCloseButtons = changes.multiShowCloseButtons.newValue !== false;
  if (showCloseButtons) void refreshMultiClose();
  else if (!sourceControl) clearMultiClose();
});
browser.runtime.onMessage.addListener(message => {
  if (message?.action === "multiSessionReady") void refreshMultiClose();
  if (message?.action === "multiSourceControl") displayMultiClose(message.session, true);
  if (message?.action === "multiSessionClosed" && managedSessionId === message.id) {
    clearMultiClose();
  }
});
// Covers navigation and fast-loading pages that finish before a batch is registered.
void refreshMultiClose();
