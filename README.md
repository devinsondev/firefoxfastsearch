# Firefox Fast Search

Firefox add-on: select text, press a keyboard shortcut, search in a new tab. No context menu needed.

**Languages:** Russian and English; switch RU / EN in Settings, without restarting.

## Features

- **F1** initially searches with Google and switches to the new results tab.
- Click **+** in Settings to add search profiles. One tab = one search engine, shortcut and tab mode.
- Assign **up to 16** independent shortcuts (Firefox must predeclare its extension commands).
- Google, DuckDuckGo, Yandex, Bing, or custom HTTPS URL with `{query}` placeholder.
- Results can open in the foreground or background for **every** profile.
- Native Firefox shortcut editor remains available; conflicting/reserved keys may not work.
- No telemetry or third-party background requests. Search text goes to the selected provider on demand.
- Images can be dropped onto Settings to change the toolbar icon instantly, or replaced in the extension folder.

## Install (temporary / unsigned)

1. Download this repository, or run `npm run build` (Python 3 required), which writes `dist/firefoxfastsearch-1.1.0.zip`.
2. Open `about:debugging#/runtime/this-firefox` in Firefox 135+.
3. Choose **Load Temporary Add-on** and select `extension/manifest.json` from the unpacked repository.
4. Select text on an ordinary web page → press `F1`; click the extension icon to edit profiles.

Temporary add-ons must be reloaded after a Firefox restart. For permanent installs, sign the built package through Mozilla Add-ons; plain unsigned ZIPs are **not** installable permanently in release Firefox.

### Update from 1.0

Keep the **same extension ID** (`firefoxfastsearch@devinsondev`) and update normally: existing Firefox commands `search-foreground` and `search-background` are still present, so their personalized shortcuts remain available. The previous `searchEngine` setting is migrated into the new profile configuration; an existing background shortcut becomes a second profile. **Avoid uninstalling first** if you need saved settings and shortcuts.

## Hotkeys

Open Settings, select a profile tab, then click **Change** and press the new combination. `Esc` cancels; **Clear** unbinds. Function keys `F1–F19` and supported Ctrl/Alt/Command combinations can be used subject to Firefox's keyboard shortcut rules. `Ctrl+Tab`, `Ctrl+P`, OS-reserved keys and other browser shortcuts cannot be stolen reliably.

New profile tabs start without a shortcut: bind one before expecting the profile to run. The editor supports one active command per profile; to create the eight possible combinations of four built-in search engines × two tab modes, add eight profiles.

For a custom engine choose **Custom URL...**, and give a URL such as `https://example.com/search?q={query}`. HTTPS is required. Firefox sends the selected text to that URL on invocation.

## Icon: replace a single file

**To change the icon everywhere** (toolbar, extensions menu, `about:addons`):

1. Put your image in **`extension/icons/icon.png`**, replacing the provided image. The **filename must be `icon.png`** and the format must actually be PNG. Square **128×128 or 256×256** recommended.
2. Reload the temporary extension under `about:debugging` (or rebuild/reinstall a signed package).

No image conversion or manifest edits are required. Firefox scales the same PNG for all requested sizes.

**To change only the toolbar icon at runtime:** drag a PNG/JPG/WebP onto the Icon panel in Settings. It is resized and stored locally, so it persists through Firefox restarts. Reset restores the on-disk icon. This runtime override **does not** change the add-on manager icon, which is fixed by the manifest.

## Development

```sh
npm run check        # syntax, manifest, icon and ≤377-line checks
npm test             # unit tests
npm run build        # extension ZIP
```

No external runtime dependencies. Source files must contain **no more than 377 lines each**. CI runs the checks and publishes a zipped build artifact.

**Limitations:** selection is not accessible in Firefox's address bar, built-in PDF viewer or privileged browser pages; shortcuts reserved by Firefox/OS cannot be overridden.
