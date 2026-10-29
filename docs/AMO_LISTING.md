# AMO listing copy (draft, for the developer)

Official source repository: https://github.com/devinsondev/firefoxfastsearch

This is suggested listing text, **not** a published AMO page or a guarantee of review approval.

## English description

Fast Search for Firefox searches selected webpage text with a single configurable keyboard shortcut. Add up to 16 search profiles, pick Google, DuckDuckGo, Yandex, Bing, or a custom HTTPS search URL, and choose whether results open in an active or background tab. Default shortcut: F1. F2 (or the icon beside selected text) opens separate popup windows for Google, Yandex, Bing, DuckDuckGo, or up to 16 configurable destinations, tiled according to screen space. Click the toolbar icon for a compact profile editor; the full settings page remains available.

**Privacy:** When you use a shortcut, selected text is sent as a search query to each selected search provider opened and may appear in browser history. This add-on has no analytics or developer-controlled search server. Avoid selecting secrets. See the privacy policy and legal notice below.

The extension uses a fixed official icon and does not support user-uploaded icons. This is an independent project, not endorsed by Mozilla or the listed search providers. Provided “AS IS” to the extent permitted by law; mandatory consumer rights remain unaffected.

## Описание на русском

Fast Search for Firefox запускает поиск по выделенному тексту одной горячей клавишей. До 16 профилей: собственная комбинация, Google / DuckDuckGo / Yandex / Bing или HTTPS-адрес и выбор активной или фоновой вкладки. По умолчанию F1 открывает поиск в активной вкладке. F2 или значок рядом с выделением открывает плиткой отдельные окна Google, Яндекс, Bing, DuckDuckGo (можно настроить до 16 поисковых сайтов). Настройка профилей доступна в компактном всплывающем окне; полная страница настроек также сохранена.

**Конфиденциальность:** После нажатия горячей клавиши выделенный текст отправляется каждому открытому поисковику и может остаться в истории браузера. Аналитики и сервера разработчика нет. Не отправляйте пароли и секретные данные. Подробнее — в политике конфиденциальности и правовом уведомлении.

Официальная иконка фиксирована, произвольные изображения пользователи загружать не могут. Независимый проект, не одобренный Mozilla или поисковиками. Расширение предоставляется «как есть» в рамках закона; обязательные права потребителей сохраняются.

## Links for AMO submission

- Privacy policy: https://github.com/devinsondev/firefoxfastsearch/blob/main/PRIVACY.md
- Disclaimer: https://github.com/devinsondev/firefoxfastsearch/blob/main/DISCLAIMER.md
- Source code: https://github.com/devinsondev/firefoxfastsearch

The manifest declares `searchTerms` and `websiteContent` because selected website text becomes a search query transmitted to an external provider. Verify the classifications with Mozilla's review team before publication. Firefox 140+ is required for the built-in data-disclosure consent experience.
