import { buildSearchUrl, SEARCH_ENGINES } from "./profiles.js";
import { readSelection } from "./selection.js";
import { normalizeAutoCloseSeconds, registerMultiSession } from "./multi-sessions.js";

export const MULTI_COMMAND = "search-multi";
export const MAX_MULTI_TARGETS = 16;
export const DEFAULT_MULTI_TARGETS = Object.freeze([
  { engine: "google" }, { engine: "yandex" },
  { engine: "bing" }, { engine: "duckduckgo" },
]);
const MIN_WIDTH = 420;
const MIN_HEIGHT = 290;
export const DEFAULT_MULTI_DISPLAY_MODE = "windows";
export function normalizeMultiDisplayMode(value) {
  return value === "tabs" ? "tabs" : DEFAULT_MULTI_DISPLAY_MODE;
}

// The single-window mode uses real Firefox tabs, not embedded search iframes.
export function tabbedWindowBounds(area) {
  const work = normalizedWorkArea(area);
  if (!work) return {};
  const width = Math.min(work.width, Math.max(900, Math.round(work.width * 0.85)));
  const height = Math.min(work.height, Math.max(650, Math.round(work.height * 0.85)));
  return {
    left: work.left + Math.floor((work.width - width) / 2),
    top: work.top + Math.floor((work.height - height) / 2),
    width, height,
  };
}

export function normalizeMultiTargets(value) {
  if (value === undefined || !Array.isArray(value)) {
    return DEFAULT_MULTI_TARGETS.map(target => ({ ...target }));
  }
  return value.slice(0, MAX_MULTI_TARGETS).flatMap(target => {
    if (!target || typeof target !== "object") return [];
    if (Object.hasOwn(SEARCH_ENGINES, target.engine)) return [{ engine: target.engine }];
    if (target.engine !== "custom" || typeof target.template !== "string") return [];
    const template = target.template.trim();
    try {
      buildSearchUrl({ engine: "custom", template }, "check");
      return [{ engine: "custom", template }];
    } catch { return []; }
  });
}

export function normalizedWorkArea(area) {
  if (!area || !["left", "top", "width", "height"].every(key => Number.isFinite(area[key]))) {
    return null;
  }
  if (area.width < 200 || area.height < 180 || area.width > 32768 || area.height > 32768) {
    return null;
  }
  return Object.fromEntries(["left", "top", "width", "height"].map(key =>
    [key, Math.round(area[key])]));
}

// Keep every tile the same size; center the last row instead of stretching its windows.
export function tileWindows(area, requested, minWidth = MIN_WIDTH, minHeight = MIN_HEIGHT) {
  const work = normalizedWorkArea(area);
  if (!work || !Number.isInteger(requested) || requested < 0) return [];
  if (!requested) return [];
  const maxColumns = Math.max(1, Math.floor(work.width / minWidth));
  const maxRows = Math.max(1, Math.floor(work.height / minHeight));
  const count = Math.min(requested, MAX_MULTI_TARGETS, maxColumns * maxRows);
  let best = { columns: 1, rows: count, score: Infinity };
  for (let columns = 1; columns <= Math.min(count, maxColumns); columns++) {
    const rows = Math.ceil(count / columns);
    if (rows > maxRows) continue;
    const ratio = (work.width / columns) / (work.height / rows);
    const empty = columns * rows - count;
    const score = Math.abs(Math.log(ratio / 1.6)) + empty * 0.15;
    if (score < best.score) best = { columns, rows, score };
  }
  const tiles = [];
  for (let row = 0, index = 0; row < best.rows; row++) {
    const inRow = Math.min(best.columns, count - index);
    const offset = (best.columns - inRow) / 2;
    const top = work.top + Math.floor(work.height * row / best.rows);
    const bottom = work.top + Math.floor(work.height * (row + 1) / best.rows);
    for (let column = 0; column < inRow; column++, index++) {
      const left = work.left + Math.floor(work.width * (column + offset) / best.columns);
      const right = work.left + Math.floor(work.width * (column + offset + 1) / best.columns);
      tiles.push({ left, top, width: right - left, height: bottom - top });
    }
  }
  return tiles;
}

// Creating several Firefox windows at once can leave their final bounds shifted.
// Reapply the entire grid only after all windows have been created.
export async function settleTiledWindows(api, entries) {
  if (typeof api.windows.update !== "function") return;
  const place = async ({ windowId, tile }) => {
    try { await api.windows.update(windowId, tile); }
    catch (error) { console.warn("Fast Search: could not align search window", error); }
  };
  // Firefox can asynchronously resize and recenter popup windows during first paint.
  // Two delayed placement passes run after its initial window-manager adjustments.
  for (const entry of entries) await place(entry);
  if (typeof api.windows.get !== "function") return;
  for (const pause of [250, 750]) {
    await new Promise(resolve => setTimeout(resolve, pause));
    for (const entry of entries) {
      try {
        const actual = await api.windows.get(entry.windowId);
        if (["left", "top", "width", "height"].some(key =>
          Number.isFinite(actual[key]) && Math.abs(actual[key] - entry.tile[key]) > 2)) {
          await place(entry);
        }
      } catch { /* The user may have closed a window during placement. */ }
    }
  }
}

async function selectedContext(api, tab) {
  let results;
  try {
    results = await api.scripting.executeScript({
      target: { tabId: tab.id, allFrames: true }, func: readSelection,
    });
  } catch {
    try {
      results = await api.scripting.executeScript({
        target: { tabId: tab.id, allFrames: false }, func: readSelection,
      });
    } catch { return null; }
  }
  const frames = results.map(item => item?.result).filter(item => item && typeof item.text === "string");
  return frames.find(frame => frame.focused && frame.text.trim()) ||
    frames.find(frame => frame.text.trim()) || null;
}

export async function openMultiSearch(api, { tab, selectedText, screenBounds } = {}) {
  const sourceTab = Number.isInteger(tab?.id) ? tab :
    (await api.tabs.query({ active: true, lastFocusedWindow: true }))[0];
  if (!Number.isInteger(sourceTab?.id)) return { opened: 0, requested: 0, reason: "noTab" };

  let text = typeof selectedText === "string" ? selectedText : "";
  let area = normalizedWorkArea(screenBounds);
  if (!text.trim() || !area) {
    const context = await selectedContext(api, sourceTab);
    if (!text.trim()) text = context?.text || "";
    if (!area) area = normalizedWorkArea(context?.screenBounds);
  }
  if (!text.trim()) return { opened: 0, requested: 0, reason: "noSelection" };

  if (!area) {
    try {
      const windowInfo = await api.windows.get(sourceTab.windowId);
      area = normalizedWorkArea(windowInfo);
    } catch { /* Some window managers do not expose a work area. */ }
  }
  const settings = await api.storage.local.get([
    "multiTargets", "multiAutoCloseSeconds", "uiLanguage", "multiDisplayMode",
  ]);
  const targets = normalizeMultiTargets(settings.multiTargets);
  const mode = normalizeMultiDisplayMode(settings.multiDisplayMode);
  if (!targets.length) return { opened: 0, requested: 0, mode, reason: "noTargets" };

  let openedWindows = [];
  let failed = 0;
  let skipped = 0;
  if (mode === "tabs") {
    // One normal Firefox window: one genuine search website per browser tab.
    // A popup type would hide browser chrome, including the tab strip.
    const urls = targets.map(target => buildSearchUrl(target, text));
    try {
      const window = await api.windows.create({
        type: "normal", focused: true, url: urls, ...tabbedWindowBounds(area),
      });
      if (Number.isInteger(window?.id)) {
        openedWindows = [window];
      } else failed = 1;
    } catch (error) {
      failed = 1;
      console.warn("Fast Search: could not open tabbed search window", error);
    }
  } else {
    if (!area) return { opened: 0, requested: targets.length, mode, reason: "noScreen" };
    const tiles = tileWindows(area, targets.length);
    skipped = targets.length - tiles.length;
    // Sequential creation prevents Firefox/Windows from overriding earlier popup
    // geometry while several new windows initialize at the same instant.
    const placed = [];
    for (const [index, tile] of tiles.entries()) {
      try {
        const window = await api.windows.create({
          url: buildSearchUrl(targets[index], text), type: "popup", ...tile,
        });
        if (Number.isInteger(window?.id)) placed.push({ window, tile });
        else failed++;
      } catch (error) {
        failed++;
        console.warn("Fast Search: could not create tiled window", error);
      }
    }
    openedWindows = placed.map(item => item.window);
    await settleTiledWindows(api, placed.map(({ window, tile }) =>
      ({ windowId: window.id, tile })));
  }

  if (openedWindows.length) {
    const seconds = normalizeAutoCloseSeconds(settings.multiAutoCloseSeconds);
    const session = {
      id: `multi-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`,
      windowIds: openedWindows.map(window => window.id),
      sourceTabId: sourceTab.id,
      expiresAt: seconds ? Date.now() + seconds * 1000 : null,
      language: settings.uiLanguage || "en",
    };
    try {
      await registerMultiSession(api, session);
      // Keep a close button on the originating page, even if the search
      // provider doesn't grant access for content scripts.
      if (typeof api.tabs.sendMessage === "function") {
        await api.tabs.sendMessage(sourceTab.id, {
          action: "multiSourceControl", session: {
            id: session.id, expiresAt: session.expiresAt, language: session.language,
          },
        }).catch(() => {});
      }
      // Firefox does not always populate window.tabs in windows.create().
      // Look up tabs explicitly. If a content script is still loading, the
      // background's tabs.onUpdated listener will notify it on completion.
      if (typeof api.tabs.sendMessage === "function") {
        await Promise.allSettled(openedWindows.map(async window => {
          const tabs = await api.tabs.query({ windowId: window.id });
          await Promise.allSettled(tabs
            .filter(tab => Number.isInteger(tab?.id))
            .map(tab => api.tabs.sendMessage(tab.id, { action: "multiSessionReady" })));
        }));
      }
    } catch (error) {
      console.warn("Fast Search: could not register multi-search window group", error);
    }
  }

  return { opened: openedWindows.length, requested: targets.length,
    mode, tabs: mode === "tabs" && openedWindows.length ? targets.length : 0,
    failed, skipped };
}
