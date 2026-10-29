# Privacy policy / Политика конфиденциальности

**Product:** Fast Search for Firefox  
**Last updated:** 2026-10-29  
**Developer:** devinsondev  
**Contact:** https://github.com/devinsondev/firefoxfastsearch/issues

## English

**What the extension accesses:** After the user presses one of the configured search shortcuts or clicks the selection icon, the extension reads the selected text in the current webpage (including accessible frames or selected text fields) to build a search request. The selection icon observes selection changes on normal webpages to offer a button. No selection text is sent to a provider until the user activates search.

**Where data goes:** The selected text becomes a search query in the new tab's, multi-search windows', or tabbed multi-search window's URLs and is sent to the **search provider(s) chosen by the user** (Google, DuckDuckGo, Yandex, Bing, or a user-configured HTTPS provider). Multi-search sends the same query to **every enabled destination whose window or tab opens**, regardless of the chosen display mode. Third-party providers may log, process, retain or share this query under their own policies. The browser may save the query URL in browsing history. Avoid selecting passwords, credentials, private messages, or other confidential data.

**What stays local:** Search profiles, custom provider URL templates, foreground/background behavior, the multi-search display mode (tiled windows or one window with tabs), auto-close delay in seconds, and language settings are stored with Firefox's local extension storage. Only IDs of extension-created multi-search windows and their optional closure deadline are kept temporarily in browser session storage to support Close all and automatic cleanup. Shortcut mappings are managed by Firefox. The extension does not send these settings to the developer.

**What the developer does not collect:** There is no developer-operated server, analytics service, advertising tracker, telemetry pipeline, or sale of user data. The extension does not intentionally collect search query logs or account identifiers for the developer.

**Control:** Users can configure or remove shortcuts, choose their provider, and uninstall the extension to remove its local storage according to Firefox's behavior. By using a search shortcut, they intentionally send the selected text to the selected provider. The extension cannot delete data already received by a third-party provider; consult that provider's privacy policy.

**External destinations:** Users who configure a custom HTTPS search URL decide which site receives their search text. The extension does not verify third-party privacy practices. The developer is not affiliated with the named search providers or Mozilla.

## Русский

**Какие данные доступны:** При выделении текста на обычных страницах расширение показывает значок; запрос отправляется только после нажатия значка или горячей клавиши. Расширение читает выделенный текст на текущей веб-странице (включая доступные фреймы и текстовые поля), чтобы сформировать поисковый запрос. Выделение отслеживается для отображения значка, но без отправки текста поисковикам до действия пользователя.

**Куда отправляются данные:** Выделенный текст становится запросом в URL новой вкладки, отдельных окон или вкладок внутри одного отдельного окна и передаётся **выбранным пользователем поисковикам** (Google, DuckDuckGo, Yandex, Bing или своему HTTPS-поисковику). При мультипоиске один запрос отправляется каждому открытому поисковику — независимо от того, открывается ли он отдельным окном или вкладкой. Сторонний сайт может обрабатывать, хранить и передавать запрос в соответствии со своей политикой. URL может попасть в историю Firefox. Не выделяйте пароли, токены, личные сообщения или другую конфиденциальную информацию.

**Что хранится локально:** Профили поиска, шаблоны пользовательских поисковиков, режимы вкладок и мультипоиска (окна плиткой или одно окно с вкладками), время автозакрытия в секундах и язык сохраняются в локальном хранилище Firefox. Идентификаторы открытых расширением окон и срок их закрытия временно хранятся в памяти сеанса браузера — для кнопки «Закрыть все» и автозакрытия. Привязками клавиш управляет Firefox. Эти настройки не отправляются разработчику.

**Что разработчик не собирает:** У проекта нет собственного сервера для запросов, аналитики, рекламных трекеров, телеметрии или продажи пользовательских данных. Расширение не ведёт поисковые журналы или учётные записи для разработчика.

**Управление:** Можно менять или отключать клавиши, выбирать поисковик и удалить расширение, чтобы Firefox очистил локальные настройки согласно своей политике. Нажатие горячей клавиши означает намеренную отправку выделенного текста выбранному поисковику. Расширение не может удалить данные, уже полученные сторонним сайтом.

**Пользовательские адреса:** При настройке своего HTTPS-URL пользователь сам определяет сайт-получатель запроса. Расширение не проверяет политику конфиденциальности сторонних сайтов. Проект не аффилирован с названными поисковиками и Mozilla.
