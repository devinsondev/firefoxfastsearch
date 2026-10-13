export const SLOT_IDS = [
  "search-foreground", "search-background",
  ...Array.from({ length: 14 }, (_, index) => `search-profile-${String(index + 3).padStart(2, "0")}`),
];
export const SEARCH_ENGINES = Object.freeze({
  google: { name: "Google", base: "https://www.google.com/search", param: "q" },
  duckduckgo: { name: "DuckDuckGo", base: "https://duckduckgo.com/", param: "q" },
  yandex: { name: "Yandex", base: "https://yandex.ru/search/", param: "text" },
  bing: { name: "Bing", base: "https://www.bing.com/search", param: "q" },
});
export const CUSTOM_TEMPLATE = "https://www.google.com/search?q={query}";

export function defaultProfile(id = SLOT_IDS[0]) {
  return { id, name: "", engine: "google", target: "foreground", template: CUSTOM_TEMPLATE };
}

export function normalizeProfiles(profiles) {
  if (!Array.isArray(profiles)) return null;
  const seen = new Set();
  const normalized = [];
  for (const candidate of profiles) {
    if (!candidate || !SLOT_IDS.includes(candidate.id) || seen.has(candidate.id)) continue;
    seen.add(candidate.id);
    normalized.push({
      id: candidate.id,
      name: typeof candidate.name === "string" ? candidate.name.slice(0, 40) : "",
      engine: Object.hasOwn(SEARCH_ENGINES, candidate.engine) || candidate.engine === "custom"
        ? candidate.engine : "google",
      target: candidate.target === "background" ? "background" : "foreground",
      template: typeof candidate.template === "string"
        ? candidate.template.slice(0, 1500) : CUSTOM_TEMPLATE,
    });
  }
  return normalized;
}

export function initialProfiles(oldEngine, commands = []) {
  const engine = Object.hasOwn(SEARCH_ENGINES, oldEngine) ? oldEngine : "google";
  const foreground = { ...defaultProfile(), engine };
  const result = [foreground];
  const background = commands.find(({ name }) => name === SLOT_IDS[1]);
  if (background?.shortcut) result.push({ ...defaultProfile(SLOT_IDS[1]), engine, target: "background" });
  return result;
}

export function firstFreeSlot(profiles) {
  return SLOT_IDS.find(id => !profiles.some(profile => profile.id === id)) ?? null;
}

export function buildSearchUrl(profile, selectedText) {
  const query = selectedText.replace(/\s+/gu, " ").trim().slice(0, 2048);
  if (!query) return null;
  if (profile.engine === "custom") {
    const template = profile.template?.trim() ?? "";
    if (!template.includes("{query}") || template.length > 1500) {
      throw new Error("A custom URL must contain {query}.");
    }
    const url = new URL(template.replaceAll("{query}", encodeURIComponent(query)));
    if (url.protocol !== "https:" || url.username || url.password) {
      throw new Error("Only HTTPS search URLs without credentials are allowed.");
    }
    return url.href;
  }
  const selected = SEARCH_ENGINES[profile.engine] ?? SEARCH_ENGINES.google;
  const url = new URL(selected.base);
  url.searchParams.set(selected.param, query);
  return url.href;
}
