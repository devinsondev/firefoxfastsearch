// Request access only to the four bundled search providers. Custom hosts
// require separate permission in Firefox's Add-ons Manager.
export const SEARCH_HOST_ORIGINS = Object.freeze([
  "https://*.google.com/*",
  "https://*.yandex.ru/*",
  "https://*.bing.com/*",
  "https://*.duckduckgo.com/*",
]);
