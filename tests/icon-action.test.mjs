import test from "node:test";
import assert from "node:assert/strict";
import { searchSelectionFromIcon } from "../extension/core/search.js";
import { defaultProfile } from "../extension/core/profiles.js";

function mockApi(settings = {}) {
  const created = [];
  const api = {
    storage: { local: { get: async () => ({ profiles: [defaultProfile()], ...settings }) } },
    commands: { getAll: async () => [] },
    tabs: { create: async options => { created.push(options); } },
  };
  return { api, created };
}
const tab = { id: 42, index: 1, windowId: 9 };

test("first-profile icon action opens search with selected text", async () => {
  const { api, created } = mockApi();
  assert.equal(await searchSelectionFromIcon(api, "four tabs", tab), true);
  assert.equal(created.length, 1);
  assert.equal(created[0].openerTabId, 42);
  assert.equal(created[0].index, 2);
  assert.equal(new URL(created[0].url).searchParams.get("q"), "four tabs");
});

test("disabled icon refuses even a stale click message", async () => {
  const { api, created } = mockApi({ selectionIconEnabled: false });
  assert.equal(await searchSelectionFromIcon(api, "private text", tab), false);
  assert.equal(created.length, 0);
});

test("invalid sender, missing profile, or blank selection opens nothing", async () => {
  const { api, created } = mockApi();
  assert.equal(await searchSelectionFromIcon(api, "query", null), false);
  assert.equal(await searchSelectionFromIcon(api, " ", tab), false);
  const noProfiles = mockApi({ profiles: [] });
  assert.equal(await searchSelectionFromIcon(noProfiles.api, "query", tab), false);
  assert.equal(created.length, 0);
  assert.equal(noProfiles.created.length, 0);
});

test("icon uses the foreground or background setting of first profile", async () => {
  const { api, created } = mockApi({ profiles: [{ ...defaultProfile(), target: "background" }] });
  assert.equal(await searchSelectionFromIcon(api, "search me", tab), true);
  assert.equal(created[0].active, false);
});
