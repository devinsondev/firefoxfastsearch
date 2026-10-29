import { buildSearchUrl, SEARCH_ENGINES } from "./profiles.js";
import { readSelection } from "./selection.js";

export const MULTI_COMMAND = "search-multi";
export const MAX_MULTI_TARGETS = 16;
export const DEFAULT_MULTI_TARGETS = Object.freeze([
  { engine: "google" }, { engine: "yandex" },
  { engine: "bing" }, { engine: "duckduckgo" },
]);
const MIN_WIDTH = 420;
const MIN_HEIGHT = 290;

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
  if (!area) return { opened: 0, requested: 0, reason: "noScreen" };

  const settings = await api.storage.local.get("multiTargets");
  const targets = normalizeMultiTargets(settings.multiTargets);
  const tiles = tileWindows(area, targets.length);
  let opened = 0;
  let failed = 0;
  for (let index = 0; index < tiles.length; index++) {
    try {
      const url = buildSearchUrl(targets[index], text);
      await api.windows.create({ url, type: "popup", ...tiles[index] });
      opened++;
    } catch (error) {
      failed++;
      console.warn("Fast Search: unable to open a multi-search window", error);
    }
  }
  return { opened, requested: targets.length, failed, skipped: targets.length - tiles.length };
}
