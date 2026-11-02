# Fast Search for Firefox

Search selected webpage text with a hotkey. Results open in a new active/background tab, a tiled grid of popup windows, or **one separate Firefox window containing a tab per search engine**.

**Languages:** English and Russian, switchable in both settings views. **Firefox:** desktop 140 or newer; Android 142 or newer if explicitly enabled for distribution.

## Features

- **Compact toolbar popup:** click the extension icon to add/edit tabs, engines, shortcuts and foreground/background mode. Use **Full settings** to open the original spacious settings page; neither view replaces the other. Changes use the same local profiles.
- **F1** searches Google in a new active tab; **F2** searches all configured multi-search sites using your chosen multi-search display mode.
- **Ctrl+Alt+F2** (default) closes **all windows created by multi-search**, including tiled popup windows or the single multi-tab window. Ordinary Firefox windows and the source webpage remain open. Change or disable this shortcut under **Multi-search → Close all windows shortcut** in either the toolbar popup or full settings. On upgrading from older releases, the unchanged Ctrl+Alt+X default is migrated to Ctrl+Alt+F2; customized and cleared shortcuts remain untouched. Firefox/OS reserved shortcuts may need a different combination.
- **Configurable selection icon:** show/hide the floating magnifier and choose **Multi-search** (default) or **First search profile** from either settings view. Adjust its precise **360° position only in Full Settings**; the toolbar popup keeps the simple controls.
- Multi-search starts with Google, Yandex, Bing, and DuckDuckGo. Edit, remove, reorder (by deleting/re-adding), or add custom HTTPS search URL templates in the toolbar or full settings; up to 16 sites are supported.
- **Multi-search display mode:** choose **Separate tiled windows** (default) or **One window with tabs** in the toolbar popup or full settings. The tabbed mode opens each search provider as a real Firefox tab in one new normal browser window, without using iframes or APIs.
- **Firefox Split View (manual):** Firefox supports displaying two existing tabs side by side. In **One window with tabs** mode, you can select a pair of tabs yourself, right-click, and choose **Open in Split View**. Firefox currently offers no published WebExtension API to automate this, so the add-on does not show a misleading Split View checkbox.
- **Simplified multi-search UI:** the redundant **Search selection** button is removed; use **F2** or the configurable icon to start multi-search. **Close all multi-search windows** remains in both popup and Full Settings. **Enable Close all buttons on search engines** (optional site access) appears **only in Full Settings**.
- **Close controls:** After starting multi-search, the original webpage also receives a floating **Close all** button; this works without access to search engine pages when the original content script is available. In Multi-search settings, uncheck **Show Close all button inside search windows** to hide the overlay on results pages (including already-open pages). The source-page control, global close button and **Ctrl+Alt+F2** shortcut still work. To show a button inside results pages, enable the checkbox and grant search-site access using **Enable Close all buttons on search engines**. Custom sites may require separate site access.
- **Fast close (v1.5.9):** **Ctrl+Alt+F2** and the on-page **Close all** button immediately send window-close requests using a live in-memory window list, without first waiting for extension storage. Closing also cancels windows still being created. Search pages and Close all overlays do not need to finish loading. Firefox itself controls the final teardown time, so OS/page unload delays remain possible.
- **Immediate focus and closing during F2 startup:** the first successfully opened search window (Google by default) is registered for closing and focused as soon as it is created. Focus is restored after each additional popup is created; you can press **Ctrl+Alt+F2** without waiting for tile corrections or Close all overlays. If the shortcut is pressed while another popup is still opening, that late popup is closed and the remaining popups are not launched. Window managers may limit focus changes.
- In tiled mode, screen dimensions are calibrated to Firefox's own window coordinates (from the source window rather than untrusted page-only `screen.availWidth` values). For a maximized source window, Firefox's measured window rectangle is used directly. Windows open sequentially with separate resize/move operations and a post-load correction. Tiles are equal-sized and odd final rows are centered. If the OS enforces a larger minimum size, a warning with expected/actual bounds appears in the extension debugger.
- A top-centered **Close all** button appears on accessible managed search pages and on the starting page. This control closes only the associated group of windows. In tabbed mode it closes the whole created window with all its tabs. The **Ctrl+Alt+F2** command and settings button close all managed groups without needing site permissions.
- Set a **custom auto-close delay in whole seconds** (1–86400, maximum 24 hours), or use **0 to disable** it (the default). Windows are tracked per browser session. Auto-close uses browser alarms plus a page timer for responsive closing; timing can be delayed by browser or OS scheduling.
- **Tiled mode only:** windows share the available screen work area, with at most as many windows as can fit the minimum size. Tabbed mode opens all configured sites (up to 16) regardless of screen space. For more tiled windows use a larger monitor; small screens intentionally skip excess sites. Browser window managers may enforce their own positioning or minimum sizes.
- **+** adds a profile tab with its own shortcut, search provider, and tab mode (up to 16 independent profiles).
- Search providers: Google, DuckDuckGo, Yandex, Bing, or a user-defined HTTPS URL with `{query}` placeholder.
- **Fixed official icon:** user-uploaded toolbar icons are not supported. The packaged 256×256 PNG is declared at its actual size in the manifest and Firefox scales it for the toolbar; this also avoids AMO icon-size mismatch warnings.
- Keyboard shortcuts are subject to Firefox / OS restrictions; some combinations are reserved.
- No advertising analytics, no developer-controlled search server, and no background tracking.

## Data transmission — read before use

Pressing a shortcut or clicking the on-page selection icon reads selected text and navigates to the chosen provider(s). With the icon enabled, selection changes are observed locally to position it; selecting alone does not transmit any text. In multi-search mode, **the same selected text is sent to every configured provider whose tab or window opens**. That query appears in each provider's URL; it can appear in Firefox history and the provider's logs. Do not search passwords, access tokens, or other secrets. Custom search URLs are controlled by the user.

The extension keeps search profiles and language settings locally. Firefox manages shortcut assignments. It does not send collected queries to developer-operated servers. See [PRIVACY.md](PRIVACY.md) and [DISCLAIMER.md](DISCLAIMER.md) (English and Russian) and the built-in **Privacy & Legal** page in Settings. The expanded bilingual warranty disclaimer and liability limitations are in [DISCLAIMER.md](DISCLAIMER.md) and the built-in legal page; neither overrides mandatory legal rights. The project is independent of Mozilla and search providers.

Firefox desktop 140+ and Firefox for Android 142+ are required for Mozilla's built-in data transmission consent. The manifest sets separate minimum versions via `gecko` and `gecko_android`. The AMO listing targets desktop Firefox; enabling Android distribution would require separate functional testing. The manifest declares required `searchTerms` and `websiteContent` because selected webpage text is sent to the chosen search provider as a search query. This declaration is **not** a claim that the developer collects queries on their own servers.

## Install for testing (temporary / unsigned)

1. Download or clone the repository.
2. Open `about:debugging#/runtime/this-firefox` in Firefox 140+.
3. Click **Load Temporary Add-on** and choose `extension/manifest.json`.
4. Select webpage text and press `F1` for one search, or `F2` for multi-search; the on-page magnifier uses the chosen click action (multi-search by default); click the add-on icon for the compact popup. Choose **Full settings** for the existing full-page editor.

Temporary add-ons disappear when Firefox restarts. To publish permanently, submit the built extension ZIP to Mozilla Add-ons for signing and review. Existing saved profiles and shortcuts are retained when upgrading the extension under the same ID: `firefoxfastsearch@devinsondev`. Version 1.2+ deletes any icon override previously saved by version 1.1. Firefox 139 and older are no longer supported.

## Package for Mozilla Add-ons (AMO)

From the repository root in **Windows PowerShell** (Python is not required):

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\package.ps1
```

Or use the cross-platform Python builder:

```powershell
python .\scripts\package.py
python .\scripts\verify_package.py
```

**Upload `dist/firefoxfastsearch-1.5.10.zip`**, not a stale 1.5.2 ZIP or a zipped GitHub Actions artifact wrapper.
Both builders use forward-slash ZIP entry names (e.g. `core/command-router.js`),
place `manifest.json` at the archive root, and reject invalid ZIP structure.
GitHub Actions builds and checks the ZIP independently on Linux and Windows.

**Do not use `Compress-Archive` for AMO builds on Windows.** It may produce
backslash entry names such as `core\command-router.js`, which Mozilla rejects.

## Optional developer checks

```sh
node scripts/check.mjs
node --test tests/*.test.mjs
python scripts/package.py
```

The GitHub Actions workflow runs checks automatically. `package.json` provides npm aliases for developers but is never packaged in the extension. Every text source file is limited to **377 lines**.

## Legal, privacy, and authenticity

- [Privacy policy / Политика конфиденциальности](PRIVACY.md)
- [Disclaimer / Отказ от гарантий](DISCLAIMER.md)
- [Security and authenticity / Подлинность](SECURITY.md)
- [Mozilla Add-ons listing draft / Текст для AMO](docs/AMO_LISTING.md)

The official toolbar and listing icon comes from the packaged `extension/icons/icon.png`. A developer can replace it **in source** before packaging a different build, but users of the official installed add-on cannot upload icons through Settings. Modified copies or screenshots are not reliable evidence of official release behavior. Legal notices are subject to mandatory applicable law and cannot guarantee protection from complaints or liability.

**Limitations:** no access to selections inside Firefox's address bar, built-in PDF viewer, or privileged pages. Firefox / OS-reserved shortcuts may not work.
