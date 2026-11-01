# Privacy policy / Политика конфиденциальности

**Product:** Fast Search for Firefox  
**Last updated:** 2026-11-01  
**Developer:** devinsondev  
**Contact:** https://github.com/devinsondev/firefoxfastsearch/issues

## English

**What the extension accesses:** When the selection icon is enabled, a local content script observes selections on HTTP(S) pages to position the button, without transmitting the text. After clicking the icon or pressing a shortcut, the extension reads the selected text in the current webpage (including accessible frames or selected text fields) to build a search request. Turning the icon off disables this local selection monitoring; shortcut searches still work.

**Where data goes:** The selected text becomes a search query in the new tab's URL and is sent to the **search provider chosen by the user** (Google, DuckDuckGo, Yandex, Bing, or a user-configured HTTPS provider). Third-party providers may log, process, retain or share this query under their own policies. The browser may save the query URL in browsing history. Avoid selecting passwords, credentials, private messages, or other confidential data.

**What stays local:** Search profiles, custom provider URL templates, foreground/background behavior, icon visibility and angle, and language settings are stored with Firefox's local extension storage. Shortcut mappings are managed by Firefox. The extension does not send these settings to the developer.

**What the developer does not collect:** There is no developer-operated server, analytics service, advertising tracker, telemetry pipeline, or sale of user data. The extension does not intentionally collect search query logs or account identifiers for the developer.

**Control:** Users can configure or remove shortcuts, choose their provider, and uninstall the extension to remove its local storage according to Firefox's behavior. By using a search shortcut, they intentionally send the selected text to the selected provider. The extension cannot delete data already received by a third-party provider; consult that provider's privacy policy.

**External destinations:** Users who configure a custom HTTPS search URL decide which site receives their search text. The extension does not verify third-party privacy practices. The developer is not affiliated with the named search providers or Mozilla.

## Русский

**Какие данные доступны:** Когда иконка включена, локальный скрипт отслеживает выделение на HTTP(S)-страницах для размещения кнопки, не передавая текст. После нажатия на иконку или горячую клавишу расширение читает выделенный текст на текущей веб-странице (включая доступные фреймы и текстовые поля), чтобы сформировать поисковый запрос. При отключении иконки локальное отслеживание выделений прекращается; горячие клавиши остаются.

**Куда отправляются данные:** Выделенный текст становится запросом в URL новой вкладки и передаётся **выбранному пользователем поисковику** (Google, DuckDuckGo, Yandex, Bing или своему HTTPS-поисковику). Сторонний сайт может обрабатывать, хранить и передавать запрос в соответствии со своей политикой. URL может попасть в историю Firefox. Не выделяйте пароли, токены, личные сообщения или другую конфиденциальную информацию.

**Что хранится локально:** Профили поиска, шаблоны пользовательских поисковиков, режимы вкладок, видимость и угол иконки, а также язык сохраняются в локальном хранилище Firefox. Привязками клавиш управляет Firefox. Эти настройки не отправляются разработчику.

**Что разработчик не собирает:** У проекта нет собственного сервера для запросов, аналитики, рекламных трекеров, телеметрии или продажи пользовательских данных. Расширение не ведёт поисковые журналы или учётные записи для разработчика.

**Управление:** Можно менять или отключать клавиши, выбирать поисковик и удалить расширение, чтобы Firefox очистил локальные настройки согласно своей политике. Нажатие горячей клавиши означает намеренную отправку выделенного текста выбранному поисковику. Расширение не может удалить данные, уже полученные сторонним сайтом.

**Пользовательские адреса:** При настройке своего HTTPS-URL пользователь сам определяет сайт-получатель запроса. Расширение не проверяет политику конфиденциальности сторонних сайтов. Проект не аффилирован с названными поисковиками и Mozilla.
