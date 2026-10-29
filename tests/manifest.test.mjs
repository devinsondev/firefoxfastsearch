import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { STRINGS } from "../extension/ui/i18n.js";

const extension = new URL("../extension/", import.meta.url);
const manifest = JSON.parse(readFileSync(new URL("manifest.json", extension), "utf8"));
test("preserves Firefox extension ID and F1 shortcut", () => {
  assert.equal(manifest.browser_specific_settings.gecko.id, "firefoxfastsearch@devinsondev");
  assert.equal(manifest.commands["search-foreground"].suggested_key.default, "F1");
});
test("declares 16 profile commands and tiled multi-search", () => {
  assert.equal(Object.keys(manifest.commands).length, 17);
  assert.equal(manifest.commands["search-multi"].suggested_key.default, "F2");
  assert.ok(manifest.permissions.includes("alarms"));
  assert.ok(!manifest.permissions.includes("windows"));
  assert.equal(manifest.content_scripts[0].js[0], "content-multi.js");
});
test("localization keys match across Russian and English", () => {
  assert.deepEqual(Object.keys(STRINGS.ru).sort(), Object.keys(STRINGS.en).sort());
});
test("all settings labels have translations", () => {
  const html = readFileSync(new URL("options.html", extension), "utf8");
  const matches = [...html.matchAll(/data-i18n(?:-placeholder|-title)?="(\w+)"/g)];
  for (const [, key] of matches) assert.ok(STRINGS.en[key] && STRINGS.ru[key], `Missing ${key}`);
});
test("icons are referenced by the manifest", () => {
  assert.equal(manifest.action.default_icon, "icons/icon.png");
  assert.equal(manifest.icons["128"], "icons/icon.png");
});

test("data transmission is disclosed with built-in Firefox consent", () => {
  const gecko = manifest.browser_specific_settings.gecko;
  assert.ok(parseInt(gecko.strict_min_version, 10) >= 140);
  assert.deepEqual(gecko.data_collection_permissions.required.sort(),
    ["searchTerms", "websiteContent"].sort());
});
test("runtime image uploads are removed, while bundled icon remains", () => {
  const html = readFileSync(new URL("options.html", extension), "utf8");
  const options = readFileSync(new URL("options.js", extension), "utf8");
  const background = readFileSync(new URL("background.js", extension), "utf8");
  assert.doesNotMatch(html, /type="file"|iconDrop|iconFile|resetIcon/);
  assert.doesNotMatch(options, /setupIconPicker|icon-picker/);
  assert.doesNotMatch(background, /applyToolbarIcon|storage\.onChanged/);
  assert.match(background, /remove\("toolbarIcon"\)/);
  assert.match(background, /setIcon\(\{ path: "icons\/icon\.png" \}\)/);
});
test("legal and privacy notices ship inside the extension in both languages", () => {
  const html = readFileSync(new URL("legal.html", extension), "utf8");
  const settings = readFileSync(new URL("options.html", extension), "utf8");
  assert.match(settings, /href="legal\.html"/);
  assert.match(html, /data-legal-copy="ru"/);
  assert.match(html, /data-legal-copy="en"/);
  assert.match(html, /AS IS/);
  assert.match(html, /максимальн/);
});

test("toolbar popup coexists with the original full settings tab", () => {
  assert.equal(manifest.action.default_popup, "popup.html");
  assert.equal(manifest.options_ui.page, "options.html");
  const background = readFileSync(new URL("background.js", extension), "utf8");
  assert.doesNotMatch(background, /action\.onClicked/);
});
test("popup reuses the full-page profile controller", () => {
  const popup = readFileSync(new URL("popup.html", extension), "utf8");
  const settings = readFileSync(new URL("options.html", extension), "utf8");
  for (const id of ["tabs", "addProfile", "counter", "emptyState", "profileControls", "editor",
    "profileHeading", "profileName", "engine", "templateRow", "customTemplate", "shortcutLabel",
    "clearShortcut", "recordShortcut", "removeProfile", "status"]) {
    for (const [name, html] of [["popup", popup], ["settings", settings]]) {
      assert.match(html, new RegExp(`id="${id}"`), `${name} missing ${id}`);
    }
  }
  assert.match(popup, /src="options\.js"/);
  assert.match(popup, /href="popup\.css"/);
  assert.match(popup, /id="fullSettings"/);
  assert.match(popup, /href="legal\.html"/);
  assert.doesNotMatch(popup, /(?:src|href)="https?:\/\//);
});
test("popup labels are localized in both languages", () => {
  const popup = readFileSync(new URL("popup.html", extension), "utf8");
  const matches = [...popup.matchAll(/data-i18n(?:-placeholder|-title)?="(\w+)"/g)];
  for (const [, key] of matches) assert.ok(STRINGS.ru[key] && STRINGS.en[key], key);
  assert.match(popup, /data-lang="ru"/);
  assert.match(popup, /data-lang="en"/);
});
test("popup does not allow users to upload custom icons", () => {
  const popup = readFileSync(new URL("popup.html", extension), "utf8");
  assert.doesNotMatch(popup, /type="file"|iconDrop|iconFile|resetIcon/);
  assert.equal(manifest.action.default_icon, "icons/icon.png");
});
