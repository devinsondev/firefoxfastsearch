import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { execFileSync } from "node:child_process";
import assert from "node:assert/strict";

const root = resolve(import.meta.dirname, "..");
const extension = join(root, "extension");
let checked = 0;
function walk(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (["node_modules", ".git", "dist"].includes(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) { walk(path); continue; }
    const data = readFileSync(path);
    if (!path.endsWith(".png")) {
      const lines = data.toString("utf8").replace(/\n$/u, "").split("\n").length;
      assert.ok(lines <= 377, `${relative(root, path)}: ${lines} lines (max 377)`);
    }
    if (/\.(?:js|mjs)$/u.test(path)) execFileSync(process.execPath, ["--check", path]);
    checked++;
  }
}
walk(root);
const manifest = JSON.parse(readFileSync(join(extension, "manifest.json"), "utf8"));
assert.equal(manifest.version, JSON.parse(readFileSync(join(root, "package.json"), "utf8")).version);
assert.equal(Object.keys(manifest.commands).length, 18);
assert.equal(manifest.commands["search-foreground"].suggested_key.default, "F1");
assert.equal(manifest.commands["close-multi-search"].suggested_key.default, "Ctrl+Alt+X");
assert.equal(manifest.action.default_popup, "popup.html");
assert.equal(manifest.options_ui.page, "options.html");
assert.ok(existsSync(join(extension, manifest.action.default_popup)));
assert.ok(existsSync(join(extension, manifest.options_ui.page)));
assert.deepEqual(manifest.permissions.slice().sort(), ["activeTab", "scripting", "storage", "alarms"].sort());
assert.equal(manifest.browser_specific_settings.gecko.strict_min_version, "140.0");
assert.equal(manifest.browser_specific_settings.gecko_android.strict_min_version, "142.0");
assert.deepEqual(Object.keys(manifest.icons), ["256"]);
for (const [size, iconPath] of Object.entries({
  ...manifest.icons, "action": manifest.action.default_icon,
})) {
  const file = join(extension, iconPath);
  assert.ok(existsSync(file), `Missing icon: ${iconPath}`);
  const png = readFileSync(file);
  assert.equal(png.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
  const expected = size === "action" ? 256 : Number(size);
  assert.equal(png.readUInt32BE(16), expected, `${iconPath}: invalid PNG width`);
  assert.equal(png.readUInt32BE(20), expected, `${iconPath}: invalid PNG height`);
}
for (const lang of ["en", "ru"]) {
  const messages = JSON.parse(readFileSync(join(extension, `_locales/${lang}/messages.json`), "utf8"));
  assert.ok(messages.extensionName?.message);
  assert.ok(messages.extensionDescription?.message);
}
console.log(`Checked ${checked} files; ≤377 lines per source file.`);
