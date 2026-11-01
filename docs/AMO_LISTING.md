# AMO listing copy (draft, for the developer)

Official source repository: https://github.com/devinsondev/firefoxfastsearch

This is suggested listing text, **not** a published AMO page or a guarantee of review approval.

## English description

Fast Search for Firefox searches selected webpage text with configurable keyboard shortcuts or an optional floating selection icon. The icon can be disabled or positioned anywhere around the selected text using a 360° dial. Add up to 16 search profiles, pick Google, DuckDuckGo, Yandex, Bing, or a custom HTTPS search URL, and choose whether results open in an active or background tab. Default shortcut: F1. Click the toolbar icon for a compact profile editor; the full settings page remains available.

**Privacy:** While the floating icon is enabled, text selections are observed locally to position it. Only when you click the icon or use a shortcut is the selected text sent as a search query to the search provider you selected and may appear in browser history. This add-on has no analytics or developer-controlled search server. Avoid selecting secrets. See the privacy policy and legal notice below.

The extension uses a fixed official icon and does not support user-uploaded icons. This is an independent project, not endorsed by Mozilla or the listed search providers. Provided “AS IS” to the extent permitted by law; mandatory consumer rights remain unaffected.

## Описание на русском

Fast Search for Firefox запускает поиск по выделенному тексту горячими клавишами или необязательной плавающей иконкой. Иконку можно отключить или разместить вокруг выделения с помощью кругового регулятора на 360°. До 16 профилей: собственная комбинация, Google / DuckDuckGo / Yandex / Bing или HTTPS-адрес и выбор активной или фоновой вкладки. По умолчанию F1 открывает поиск в активной вкладке. Настройка профилей доступна в компактном всплывающем окне; полная страница настроек также сохранена.

**Конфиденциальность:** При включённой иконке выделение отслеживается локально для размещения кнопки. Только после нажатия иконки или горячей клавиши текст отправляется выбранному поисковику и может остаться в истории браузера. Аналитики и сервера разработчика нет. Не отправляйте пароли и секретные данные. Подробнее — в политике конфиденциальности и правовом уведомлении.

Официальная иконка фиксирована, произвольные изображения пользователи загружать не могут. Независимый проект, не одобренный Mozilla или поисковиками. Расширение предоставляется «как есть» в рамках закона; обязательные права потребителей сохраняются.

## Links for AMO submission

- Privacy policy: https://github.com/devinsondev/firefoxfastsearch/blob/main/PRIVACY.md
- Disclaimer: https://github.com/devinsondev/firefoxfastsearch/blob/main/DISCLAIMER.md
- Source code: https://github.com/devinsondev/firefoxfastsearch

The manifest declares `searchTerms` and `websiteContent` because selected website text becomes a search query transmitted to an external provider. Verify the classifications with Mozilla's review team before publication. Firefox 140+ is required for the built-in data-disclosure consent experience.
