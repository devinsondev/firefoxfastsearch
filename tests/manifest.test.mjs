import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const manifest=JSON.parse(readFileSync(new URL("../extension/manifest.json",import.meta.url),"utf8"));
test("F1 opens foreground search",()=>assert.equal(manifest.commands["search-foreground"].suggested_key.default,"F1"));
test("background shortcut exists",()=>assert.ok(manifest.commands["search-background"]));
test("minimal permissions",()=>assert.deepEqual(manifest.permissions.sort(),["activeTab","scripting","storage"].sort()));
