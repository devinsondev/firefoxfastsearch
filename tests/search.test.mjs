import test from "node:test";
import assert from "node:assert/strict";
import { searchByCommand } from "../extension/core/search.js";
import { defaultProfile, SLOT_IDS } from "../extension/core/profiles.js";
import { preferFocusedSelection } from "../extension/core/selection.js";

function makeBrowser({ profiles = [defaultProfile()], selected = "hello", failFrames = false, failAll = false } = {}) {
  const created = [];
  const injections = [];
  const tab = { id: 30, index: 2, windowId: 7 };
  const api = {
    storage: { local: { get: async () => ({ profiles }) } },
    commands: { getAll: async () => [] },
    tabs: { query: async () => [tab], create: async options => { created.push(options); } },
    scripting: { executeScript: async options => {
      injections.push(options);
      if (failAll || (failFrames && options.target.allFrames)) throw new Error("Blocked");
      return [{ result: { text: selected, focused: true } }];
    } },
  };
  return { api, created, injections, tab };
}
test("F1 opens and focuses search in an adjacent tab", async () => {
  const { api, created, tab } = makeBrowser();
  assert.equal(await searchByCommand(api, SLOT_IDS[0], tab), true);
  assert.equal(created.length, 1);
  assert.equal(created[0].active, true);
  assert.equal(created[0].windowId, 7);
  assert.equal(created[0].index, 3);
  assert.equal(created[0].openerTabId, 30);
  assert.equal(new URL(created[0].url).searchParams.get("q"), "hello");
});
test("background mode never activates the new tab", async () => {
  const profile = { ...defaultProfile(SLOT_IDS[2]), engine: "bing", target: "background" };
  const { api, created } = makeBrowser({ profiles: [profile] });
  assert.equal(await searchByCommand(api, SLOT_IDS[2]), true);
  assert.equal(created[0].active, false);
  assert.equal(new URL(created[0].url).searchParams.get("q"), "hello");
});
test("inactive slot cannot open anything", async () => {
  const { api, created } = makeBrowser();
  assert.equal(await searchByCommand(api, SLOT_IDS[3]), false);
  assert.equal(created.length, 0);
});
test("empty selection never creates a tab", async () => {
  const { api, created } = makeBrowser({ selected: "  " });
  assert.equal(await searchByCommand(api, SLOT_IDS[0]), false);
  assert.equal(created.length, 0);
});
test("falls back to top frame if one frame blocks injection", async () => {
  const { api, created, injections } = makeBrowser({ failFrames: true });
  assert.equal(await searchByCommand(api, SLOT_IDS[0]), true);
  assert.deepEqual(injections.map(item => item.target.allFrames), [true, false]);
  assert.equal(created.length, 1);
});
test("restricted pages produce no tabs and do not crash", async () => {
  const { api, created } = makeBrowser({ failAll: true });
  assert.equal(await searchByCommand(api, SLOT_IDS[0]), false);
  assert.equal(created.length, 0);
});
test("prefers focused iframe selection to a stale top-level selection", () => {
  const results = [
    { result: { text: "old text", focused: false } },
    { result: { text: "new text", focused: true } },
  ];
  assert.equal(preferFocusedSelection(results), "new text");
});
test("falls back to first nonempty frame", () => {
  assert.equal(preferFocusedSelection([
    { result: { text: " ", focused: true } },
    { result: { text: "actual", focused: false } },
  ]), "actual");
});
