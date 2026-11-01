const STORAGE_KEY = "multiSearchSessions";
export const ALARM_PREFIX = "fastsearch-close-";
export const CLOSE_MULTI_COMMAND = "close-multi-search";
export const MAX_AUTO_CLOSE_SECONDS = 86400; // 0 disables automatic closing.

// Serialize local storage.session mutations so simultaneous batches do not overwrite each other.
let updates = Promise.resolve();
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
  if (session.expiresAt) {
    await api.alarms.create(ALARM_PREFIX + session.id, { when: session.expiresAt });
  }
  return true;
}

export async function multiSessionForWindow(api, windowId) {
  if (!Number.isInteger(windowId)) return null;
  const data = await api.storage.session.get(STORAGE_KEY);
  const sessions = Array.isArray(data[STORAGE_KEY]) ? data[STORAGE_KEY] : [];
  const session = sessions.find(item => Array.isArray(item.windowIds) && item.windowIds.includes(windowId));
  return session ? { id: session.id, expiresAt: session.expiresAt, language: session.language } : null;
}

export async function closeMultiSession(api, sessionId, requestingWindowId, requestingTabId) {
  if (typeof sessionId !== "string" || !sessionId.startsWith("multi-")) return false;
  const target = await updateSessions(api, sessions => {
    const found = sessions.find(item => item.id === sessionId && (
      requestingWindowId === undefined ||
      item.windowIds.includes(requestingWindowId) ||
      (Number.isInteger(requestingTabId) && item.sourceTabId === requestingTabId)
    ));
    return { sessions: found ? sessions.filter(item => item !== found) : sessions, result: found };
  });
  if (!target) return false;
  await Promise.allSettled([
    Number.isInteger(target.sourceTabId)
      ? api.tabs.sendMessage(target.sourceTabId, { action: "multiSessionClosed", id: sessionId })
        .catch(() => {})
      : Promise.resolve(),
    api.alarms.clear(ALARM_PREFIX + sessionId),
    ...target.windowIds.map(windowId => api.windows.remove(windowId)),
  ]);
  return true;
}

export async function forgetMultiWindow(api, windowId) {
  if (!Number.isInteger(windowId)) return;
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
}

export async function closeAllMultiSessions(api) {
  const sessions = (await api.storage.session.get(STORAGE_KEY))[STORAGE_KEY] || [];
  return Promise.allSettled(sessions.map(session => closeMultiSession(api, session.id)));
}
