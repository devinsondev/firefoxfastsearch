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

export function normalizeSplitPairs(value) {
  return value === true;
}

// Future-compatible: Firefox currently exposes splitViewId read-only. If a
// supported createSplit API arrives, pair adjacent real tabs automatically.
export async function createAvailableSplitPairs(api, windowId, count, enabled) {
  if (!enabled || count < 2) return { applied: 0, requested: 0, supported: false };
  const requested = Math.floor(count / 2);
  if (typeof api.tabs?.createSplit !== "function") {
    return { applied: 0, requested, supported: false };
  }
  let tabs;
  try {
    tabs = await api.tabs.query({ windowId });
  } catch (error) {
    console.warn("Fast Search: cannot read tabs for split view", error);
    return { applied: 0, requested, supported: true };
  }
  // Only pair adjacent, newly created tabs in the new window.
  const ordered = tabs.filter(item => Number.isInteger(item?.id))
    .sort((left, right) => left.index - right.index).slice(0, count);
  let applied = 0;
  for (let index = 0; index + 1 < ordered.length; index += 2) {
    try {
      await api.tabs.createSplit([ordered[index].id, ordered[index + 1].id]);
      applied++;
    } catch (error) {
      console.warn("Fast Search: could not create split view pair", error);
    }
  }
  return { applied, requested, supported: true };
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

// Pick a grid with readable cells. The final row expands to use the full screen.
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
    const top = work.top + Math.floor(work.height * row / best.rows);
    const bottom = work.top + Math.floor(work.height * (row + 1) / best.rows);
    for (let column = 0; column < inRow; column++, index++) {
      const left = work.left + Math.floor(work.width * column / inRow);
      const right = work.left + Math.floor(work.width * (column + 1) / inRow);
      tiles.push({ left, top, width: right - left, height: bottom - top });
    }
  }
  return tiles;
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
    "multiTargets", "multiAutoCloseSeconds", "uiLanguage", "multiDisplayMode", "multiSplitPairs",
  ]);
  const targets = normalizeMultiTargets(settings.multiTargets);
  const mode = normalizeMultiDisplayMode(settings.multiDisplayMode);
  if (!targets.length) return { opened: 0, requested: 0, mode, reason: "noTargets" };

  let openedWindows = [];
  let failed = 0;
  let skipped = 0;
  let split = { applied: 0, requested: 0, supported: false };
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
        split = await createAvailableSplitPairs(api, window.id, urls.length,
          normalizeSplitPairs(settings.multiSplitPairs));
      } else failed = 1;
    } catch (error) {
      failed = 1;
      console.warn("Fast Search: could not open tabbed search window", error);
    }
  } else {
    if (!area) return { opened: 0, requested: targets.length, mode, reason: "noScreen" };
    const tiles = tileWindows(area, targets.length);
    skipped = targets.length - tiles.length;
    // Start every browser window immediately; do not wait for previous windows to load.
    const results = await Promise.allSettled(tiles.map((tile, index) =>
      api.windows.create({ url: buildSearchUrl(targets[index], text), type: "popup", ...tile })));
    openedWindows = results.filter(result => result.status === "fulfilled" &&
      Number.isInteger(result.value?.id)).map(result => result.value);
    failed = results.length - openedWindows.length;
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
      await api.tabs.sendMessage(sourceTab.id, {
        action: "multiSourceControl", session: {
          id: session.id, expiresAt: session.expiresAt, language: session.language,
        },
      }).catch(() => {});
      // Firefox does not always populate window.tabs in windows.create().
      // Look up tabs explicitly. If a content script is still loading, the
      // background's tabs.onUpdated listener will notify it on completion.
      await Promise.allSettled(openedWindows.map(async window => {
        const tabs = await api.tabs.query({ windowId: window.id });
        await Promise.allSettled(tabs
          .filter(tab => Number.isInteger(tab?.id))
          .map(tab => api.tabs.sendMessage(tab.id, { action: "multiSessionReady" })));
      }));
    } catch (error) {
      console.warn("Fast Search: could not register multi-search window group", error);
    }
  }

  return { opened: openedWindows.length, requested: targets.length,
    mode, tabs: mode === "tabs" && openedWindows.length ? targets.length : 0,
    split, failed, skipped };
}
