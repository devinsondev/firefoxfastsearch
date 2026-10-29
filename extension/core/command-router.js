import { searchByCommand } from "./search.js";
import { MULTI_COMMAND, openMultiSearch } from "./multi-search.js";
import { CLOSE_MULTI_COMMAND, closeAllMultiSessions } from "./multi-sessions.js";

// Closing is a browser command, so it works with focus in any search window
// and never needs permission to read the search provider's page.
export function runSearchCommand(api, command, tab) {
  if (command === CLOSE_MULTI_COMMAND) return closeAllMultiSessions(api);
  if (command === MULTI_COMMAND) return openMultiSearch(api, { tab });
  return searchByCommand(api, command, tab);
}
