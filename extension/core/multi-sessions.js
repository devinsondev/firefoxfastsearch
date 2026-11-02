const STORAGE_KEY = "multiSearchSessions";
export const ALARM_PREFIX = "fastsearch-close-";
export const CLOSE_MULTI_COMMAND = "close-multi-search";
export const MAX_AUTO_CLOSE_SECONDS = 86400; // 0 disables automatic closing.

// Serialize local storage.session mutations so simultaneous batches do not overwrite each other.
let updates = Promise.resolve();
// Optimistic in-memory index of windows created in this background lifetime.
// Window closing must not wait for storage.session, page loads or tile correction.
const liveByApi = new WeakMap();
function liveSessionsFor(api) {
  if (!liveByApi.has(api)) liveByApi.set(api, new Map());
  return liveByApi.get(api);
}
function requestRemoval(api, id) {
  try { return Promise.resolve(api.windows.remove(id)).catch(() => {}); }
  catch { return Promise.resolve(); }
}
function beginClose(api, entry) {
  if (entry.closing) return entry.removals;
  entry.closing = true; // Cancel pending window creation immediately.
  entry.requested = new Set(entry.windowIds);
  entry.removals = [...entry.requested].map(id => requestRemoval(api, id));
  return entry.removals;
}

function updateSessions(api, change) {
  const task = updates.catch(() => {}).then(async () => {
    const data = await api.storage.session.get(STORAGE_KEY);
    const existing = Array.isArray(data[STORAGE_KEY]) ? data[STORAGE_KEY] : [];
    const { sessions, result } = change(existing);
    await api.storage.session.set({ [STORAGE_KEY]: sessions });
    return result;
  });
  updates = task.catch(() => {});
  return task;
}

export function normalizeAutoCloseSeconds(value) {
  const seconds = Number(value ?? 0);
  return Number.isSafeInteger(seconds) && seconds >= 0 && seconds <= MAX_AUTO_CLOSE_SECONDS
    ? seconds : 0;
}

export async function registerMultiSession(api, session) {
  if (!session || typeof session.id !== "string" ||
      !Array.isArray(session.windowIds) || !session.windowIds.length) return false;
  const entry = {
    windowIds: new Set(session.windowIds.filter(Number.isInteger)),
    sourceTabId: session.sourceTabId, expiresAt: session.expiresAt,
    language: session.language === "ru" ? "ru" : "en",
    closing: false, requested: new Set(), removals: [],
  };
  liveSessionsFor(api).set(session.id, entry);
  try {
    await updateSessions(api, sessions => ({
      sessions: [...sessions, {
        id: session.id,
        windowIds: [...new Set(session.windowIds.filter(Number.isInteger))],
        sourceTabId: Number.isInteger(session.sourceTabId) ? session.sourceTabId : null,
        expiresAt: Number.isFinite(session.expiresAt) ? session.expiresAt : null,
        language: session.language === "ru" ? "ru" : "en",
      }],
      result: true,
    }));
    if (session.expiresAt && !entry.closing) {
      await api.alarms.create(ALARM_PREFIX + session.id, { when: session.expiresAt });
    }
    return !entry.closing;
  } catch (error) {
    if (!entry.closing) liveSessionsFor(api).delete(session.id);
    throw error;
  }
}

// Attach each newly opened window immediately, so Ctrl+Alt+F2 can close
// the group while the remaining tiled windows are still being created.
// Returning false means the user already closed the group.
export async function appendMultiSessionWindow(api, sessionId, windowId) {
  if (typeof sessionId !== "string" || !Number.isInteger(windowId)) return false;
  const entry = liveSessionsFor(api).get(sessionId);
  if (entry?.closing) return false;
  entry?.windowIds.add(windowId);
  const saved = await updateSessions(api, sessions => {
    const active = sessions.find(item => item.id === sessionId);
    if (!active) return { sessions, result: false };
    const next = sessions.map(item => item === active
      ? { ...item, windowIds: [...new Set([...item.windowIds, windowId])] } : item);
    return { sessions: next, result: true };
  });
  if (!saved) entry?.windowIds.delete(windowId);
  return Boolean(saved && !entry?.closing);
}

// Wait for queued storage changes before deciding whether to launch the next window.
export async function isMultiSessionActive(api, sessionId) {
  if (typeof sessionId !== "string") return false;
  const entry = liveSessionsFor(api).get(sessionId);
  if (entry) return !entry.closing;
  await updates.catch(() => {});
  const data = await api.storage.session.get(STORAGE_KEY);
  return Array.isArray(data[STORAGE_KEY]) &&
    data[STORAGE_KEY].some(item => item.id === sessionId);
}

export async function multiSessionForWindow(api, windowId) {
  if (!Number.isInteger(windowId)) return null;
  for (const [id, entry] of liveSessionsFor(api)) {
    if (!entry.closing && entry.windowIds.has(windowId)) {
      return { id, expiresAt: entry.expiresAt, language: entry.language };
    }
  }
  const data = await api.storage.session.get(STORAGE_KEY);
  const sessions = Array.isArray(data[STORAGE_KEY]) ? data[STORAGE_KEY] : [];
  const session = sessions.find(item => Array.isArray(item.windowIds) && item.windowIds.includes(windowId));
  return session ? { id: session.id, expiresAt: session.expiresAt, language: session.language } : null;
}

export async function closeMultiSession(api, sessionId, requestingWindowId, requestingTabId) {
  if (typeof sessionId !== "string" || !sessionId.startsWith("multi-")) return false;
  const entry = liveSessionsFor(api).get(sessionId);
  if (entry && requestingWindowId !== undefined &&
      !entry.windowIds.has(requestingWindowId) &&
      !(Number.isInteger(requestingTabId) && entry.sourceTabId === requestingTabId)) {
    return false; // Never allow an unrelated page to close another group.
  }
  // Send close requests before the first await. This also makes the Close all
  // overlay just as responsive as the keyboard command.
  const started = Boolean(entry && !entry.closing);
  const fastRemovals = entry ? beginClose(api, entry) : [];
  const target = await updateSessions(api, sessions => {
    const found = sessions.find(item => item.id === sessionId && (
      requestingWindowId === undefined ||
      item.windowIds.includes(requestingWindowId) ||
      (Number.isInteger(requestingTabId) && item.sourceTabId === requestingTabId)
    ));
    return { sessions: found ? sessions.filter(item => item !== found) : sessions, result: found };
  });
  if (!target) {
    await Promise.allSettled(fastRemovals);
    liveSessionsFor(api).delete(sessionId);
    return started;
  }
  // A stored session may contain a window created before background restart.
  // Avoid issuing a duplicate remove for windows already closed optimistically.
  const extra = target.windowIds.filter(id => !entry?.requested.has(id))
    .map(id => requestRemoval(api, id));
  await Promise.allSettled([
    ...fastRemovals, ...extra,
    Number.isInteger(target.sourceTabId) && api.tabs?.sendMessage
      ? api.tabs.sendMessage(target.sourceTabId,
        { action: "multiSessionClosed", id: sessionId }).catch(() => {})
      : Promise.resolve(),
    api.alarms.clear(ALARM_PREFIX + sessionId),
  ]);
  liveSessionsFor(api).delete(sessionId);
  return true;
}

export async function forgetMultiWindow(api, windowId) {
  if (!Number.isInteger(windowId)) return;
  for (const entry of liveSessionsFor(api).values()) {
    entry.windowIds.delete(windowId);
    if (!entry.windowIds.size) entry.closing = true;
  }
  const retired = await updateSessions(api, sessions => {
    const ended = [];
    const next = sessions.map(session => {
      if (!session.windowIds.includes(windowId)) return session;
      const remaining = session.windowIds.filter(id => id !== windowId);
      if (!remaining.length) {
        ended.push(session.id);
        return null;
      }
      return { ...session, windowIds: remaining };
    }).filter(Boolean);
    return { sessions: next, result: ended };
  });
  await Promise.allSettled(retired.map(id => api.alarms.clear(ALARM_PREFIX + id)));
  for (const id of retired) liveSessionsFor(api).delete(id);
}

export async function closeAllMultiSessions(api) {
  // All remove() calls start NOW, before storage gets/sets and before we
  // wait for any Firefox windows.remove() promise to resolve.
  const fastRemovals = [];
  for (const entry of liveSessionsFor(api).values()) {
    fastRemovals.push(...beginClose(api, entry));
  }
  // Any in-flight register/append writes must complete before cleanup; this
  // wait no longer delays visual window closing.
  await updates.catch(() => {});
  const data = await api.storage.session.get(STORAGE_KEY);
  const sessions = Array.isArray(data[STORAGE_KEY]) ? data[STORAGE_KEY] : [];
  const result = await Promise.allSettled(sessions.map(session =>
    closeMultiSession(api, session.id)));
  await Promise.allSettled(fastRemovals);
  const activeIds = new Set(sessions.map(item => item.id));
  for (const [id, entry] of liveSessionsFor(api)) {
    if (entry.closing && !activeIds.has(id)) liveSessionsFor(api).delete(id);
  }
  return result;
}
