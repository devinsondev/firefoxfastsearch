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
