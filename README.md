# Fast Search for Firefox

Search selected webpage text with a hotkey. Results open in a new active/background tab, a tiled grid of popup windows, or **one separate Firefox window containing a tab per search engine**.

**Languages:** English and Russian, switchable in both settings views. **Firefox:** desktop 140 or newer.

## Features

- **Compact toolbar popup:** click the extension icon to add/edit tabs, engines, shortcuts and foreground/background mode. Use **Full settings** to open the original spacious settings page; neither view replaces the other. Changes use the same local profiles.
- **F1** searches Google in a new active tab; **F2** searches all configured multi-search sites using your chosen multi-search display mode.
- Select text and click the on-page magnifier for the same multi-search action.
- Multi-search starts with Google, Yandex, Bing, and DuckDuckGo. Edit, remove, reorder (by deleting/re-adding), or add custom HTTPS search URL templates in the toolbar or full settings; up to 16 sites are supported.
- **Multi-search display mode:** choose **Separate tiled windows** (default) or **One window with tabs** in the toolbar popup or full settings. The tabbed mode opens each search provider as a real Firefox tab in one new normal browser window, without using iframes or APIs.
- **Optional Split View pairing:** In **One window with tabs** mode, check **Pair tabs in Split View**. Firefox currently has no public WebExtension API to create native Split Views automatically, so the four searches remain ordered as Google + Yandex / Bing + DuckDuckGo until you pair them. The first two tabs are **preselected**: right-click either and choose **Open in Split View**. Then select tab 3 and Alt+click tab 4. The extension automatically pairs them if Firefox later exposes `browser.tabs.createSplit()`. This checkbox never circumvents website iframe restrictions.
- **Close controls:** After starting multi-search, the original webpage also receives a floating **Close all** button; this works without access to search engine pages when the original content script is available. To show the same close control *inside the four search results pages*, click **Enable Close all buttons on search engines** in settings and approve Firefox's limited access to the four built-in search providers. Reload those result pages or open a fresh search after granting access. Custom sites may require separate site access.
- In tiled mode, window creation is requested **in parallel**, not one after another. Firefox or the operating system may still stagger their appearance.
- A top-centered **Close all** button appears on accessible managed search pages and on the starting page. This control closes only the associated group of windows. In tabbed mode it closes the whole created window with all its tabs. The settings panel can always close all managed groups.
- Set a **custom auto-close delay in whole seconds** (1–86400, maximum 24 hours), or use **0 to disable** it (the default). Windows are tracked per browser session. Auto-close uses browser alarms plus a page timer for responsive closing; timing can be delayed by browser or OS scheduling.
- **Tiled mode only:** windows share the available screen work area, with at most as many windows as can fit the minimum size. Tabbed mode opens all configured sites (up to 16) regardless of screen space. For more tiled windows use a larger monitor; small screens intentionally skip excess sites. Browser window managers may enforce their own positioning or minimum sizes.
- **+** adds a profile tab with its own shortcut, search provider, and tab mode (up to 16 independent profiles).
- Search providers: Google, DuckDuckGo, Yandex, Bing, or a user-defined HTTPS URL with `{query}` placeholder.
- **Fixed official icon:** user-uploaded toolbar icons are not supported. This reduces the ability to misrepresent the official add-on with offensive or misleading imagery.
- Keyboard shortcuts are subject to Firefox / OS restrictions; some combinations are reserved.
- No advertising analytics, no developer-controlled search server, and no background tracking.

## Data transmission — read before use

Pressing a shortcut or clicking the on-page multi-search icon reads selected text and navigates to the chosen provider(s). In multi-search mode, **the same selected text is sent to every configured provider whose tab or window opens**. That query appears in each provider's URL; it can appear in Firefox history and the provider's logs. Do not search passwords, access tokens, or other secrets. Custom search URLs are controlled by the user.

The extension keeps search profiles and language settings locally. Firefox manages shortcut assignments. It does not send collected queries to developer-operated servers. See [PRIVACY.md](PRIVACY.md) and [DISCLAIMER.md](DISCLAIMER.md) (English and Russian) and the built-in **Privacy & Legal** page in Settings. The project is independent of Mozilla and search providers.

Firefox 140+ is required for Mozilla's built-in data transmission consent. The manifest declares required `searchTerms` and `websiteContent` because selected webpage text is sent to the chosen search provider as a search query. This declaration is **not** a claim that the developer collects queries on their own servers.

## Install for testing (temporary / unsigned)

1. Download or clone the repository.
2. Open `about:debugging#/runtime/this-firefox` in Firefox 140+.
3. Click **Load Temporary Add-on** and choose `extension/manifest.json`.
4. Select webpage text and press `F1` for one search, or `F2` / the on-page magnifier for multi-search in the selected display mode; click the add-on icon for the compact popup. Choose **Full settings** for the existing full-page editor.

Temporary add-ons disappear when Firefox restarts. To publish permanently, submit the built extension ZIP to Mozilla Add-ons for signing and review. Existing saved profiles and shortcuts are retained when upgrading the extension under the same ID: `firefoxfastsearch@devinsondev`. Version 1.2+ deletes any icon override previously saved by version 1.1. Firefox 139 and older are no longer supported.

## Package without npm

Run this in **PowerShell**, at the repository root:

```powershell
Compress-Archive -Path .\extension\* -DestinationPath .\firefoxfastsearch-1.4.0.zip -Force
```

The ZIP must contain `manifest.json` at the archive root. You can alternatively run `python scripts/package.py` for a deterministic, extension-only ZIP in `dist/`. Neither npm nor Python is required **to use** the add-on.

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
