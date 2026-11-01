export const STRINGS = {
  ru: {
    headline: "Выделил. Нажал. Нашёл.",
    subtitle: "Свои клавиши для каждого поисковика и способа открытия.",
    profiles: "Профили поиска", profilesHelp: "Каждая вкладка — отдельная клавиша и действие.",
    addProfileTitle: "Добавить профиль", profileDetails: "НАСТРОЙКА ПРОФИЛЯ",
    emptyTitle: "Пока нет профилей", emptyHelp: "Нажми +, чтобы создать первый.",
    deleteProfile: "Удалить профиль", displayName: "Название (необязательно)",
    namePlaceholder: "Например, быстрый перевод", searchEngine: "Поисковик",
    customEngine: "Свой URL...", customUrl: "Адрес поиска с {query}",
    urlHelp: "Только HTTPS. Напиши {query} там, где должен быть запрос.",
    openMode: "Открывать результаты", foreground: "Перейти в новую вкладку",
    foregroundHelp: "Сразу показывает результаты", background: "Открыть в фоне",
    backgroundHelp: "Остаться на текущей вкладке", hotkey: "Горячая клавиша",
    change: "Изменить", clear: "Убрать",
    hotkeyHelp: "Нажми «Изменить», затем комбинацию. Esc — отмена.",
    iconSettingsHeading: "Иконка при выделении",
    iconSettingsHelp: "Нажатие иконки запускает выбранный поиск.",
    iconEnabled: "Показывать иконку при выделении текста",
    iconEnabledHelp: "Выключение не влияет на горячие клавиши.",
    iconSearchAction: "Действие при нажатии",
    iconActionMulti: "Мультипоиск (все выбранные сайты)",
    iconActionSingle: "Первый поисковый профиль",
    iconPosition: "Положение относительно текста",
    iconSample: "слово",
    iconDialHelp: "Перетаскивай значок вокруг слова по кругу на 360°.",
    iconDialKeyboard: "Стрелки: шаг 5°. Shift + стрелки: 15°.",
    resetIconAngle: "Вернуть вправо",
    disclosureHeading: "Передача текста",
    disclosureText: "При включённой иконке расширение локально отслеживает выделение на сайтах. Текст отправляется одному или нескольким выбранным поисковикам только при нажатии иконки или горячей клавиши и может попасть в историю. Не отправляй секреты.",
    legalLink: "Конфиденциальность и отказ от гарантий ↗",
    firefoxShortcuts: "Сочетания клавиш Firefox ↗",
    footer: "Без аналитики. Выделение в адресной строке и на служебных страницах недоступно.",
    emptyKey: "Не назначено", pressKey: "Нажми клавиши…", cancelled: "Отменено.",
    modeForeground: "Активная", modeBackground: "В фоне",
    configured: "Комбинация сохранена.", removed: "Комбинация убрана.",
    saved: "Настройки сохранены.", profileCreated: "Профиль добавлен.",
    profileDeleted: "Профиль удалён.", tooMany: "Максимум 16 профилей.",
    conflicting: "Эта комбинация уже назначена другому профилю.",
    unsupported: "Firefox не поддерживает такую клавишу.",
    needsModifier: "Нужен Ctrl / Alt / Command (или F1–F19 без модификаторов).",
    reserved: "Если сочетание занято Firefox, оно может не сработать.",
    invalidTemplate: "Для своего поисковика нужен HTTPS URL c {query}.",
    confirmDelete: "Удалить этот профиль и его клавишу?",
    popupForeground: "С переходом", popupBackground: "В фоне",
    popupDisclosure: "Выделение отслеживается локально, если включена иконка. Поиск отправляет текст выбранным поисковикам. Не используй для секретов.",
    openFullSettings: "Полные настройки ↗", popupLegal: "Правовая информация ↗",
  },
  en: {
    headline: "Select. Press. Search.",
    subtitle: "Your shortcuts for every search engine and tab behavior.",
    profiles: "Search profiles", profilesHelp: "Each tab is a separate shortcut and action.",
    addProfileTitle: "Add profile", profileDetails: "PROFILE SETTINGS",
    emptyTitle: "No profiles yet", emptyHelp: "Click + to create the first one.",
    deleteProfile: "Delete profile", displayName: "Display name (optional)",
    namePlaceholder: "For example, quick translation", searchEngine: "Search engine",
    customEngine: "Custom URL...", customUrl: "Search URL with {query}",
    urlHelp: "HTTPS only. Put {query} where the search text should go.",
    openMode: "Open results", foreground: "Switch to new tab",
    foregroundHelp: "Show results immediately", background: "Open in background",
    backgroundHelp: "Keep the current tab focused", hotkey: "Keyboard shortcut",
    change: "Change", clear: "Clear",
    hotkeyHelp: "Click Change, then press a shortcut. Esc cancels.",
    iconSettingsHeading: "Selection icon",
    iconSettingsHelp: "Clicking the icon starts the selected search action.",
    iconEnabled: "Show icon when selecting text",
    iconEnabledHelp: "Turning this off does not affect keyboard shortcuts.",
    iconSearchAction: "Action when clicking",
    iconActionMulti: "Multi-search (all selected engines)",
    iconActionSingle: "First search profile",
    iconPosition: "Position around selected text",
    iconSample: "word",
    iconDialHelp: "Drag the icon around the word through 360°.",
    iconDialKeyboard: "Arrow keys: 5° steps. Shift + arrows: 15°.",
    resetIconAngle: "Reset to right",
    disclosureHeading: "Sending selected text",
    disclosureText: "When the icon is enabled, the add-on observes selections locally on webpages. Text is sent to your chosen search provider(s) only when you click the icon or use a shortcut, and may appear in history. Avoid secrets.",
    legalLink: "Privacy & legal notice ↗",
    firefoxShortcuts: "Firefox extension shortcuts ↗",
    footer: "No analytics. Cannot read selections in the address bar or on internal pages.",
    emptyKey: "Not assigned", pressKey: "Press shortcut…", cancelled: "Cancelled.",
    modeForeground: "Active tab", modeBackground: "Background",
    configured: "Shortcut saved.", removed: "Shortcut cleared.",
    saved: "Settings saved.", profileCreated: "Profile added.",
    profileDeleted: "Profile deleted.", tooMany: "Maximum 16 profiles.",
    conflicting: "This shortcut is already assigned to another profile.",
    unsupported: "This key is not supported by Firefox.",
    needsModifier: "Use Ctrl / Alt / Command, or F1–F19 on its own.",
    reserved: "Shortcuts reserved by Firefox may not work.",
    invalidTemplate: "Custom search requires an HTTPS URL with {query}.",
    confirmDelete: "Delete this profile and its shortcut?",
    popupForeground: "Switch to tab", popupBackground: "Background",
    popupDisclosure: "With the icon enabled, selections are observed locally. Searching sends text to your chosen provider(s). Avoid secrets.",
    openFullSettings: "Full settings ↗", popupLegal: "Privacy & Legal ↗",
  },
};
export function translate(language, key) {
  return STRINGS[language]?.[key] ?? STRINGS.en[key] ?? key;
}
export function applyLanguage(language) {
  document.documentElement.lang = language;
  for (const element of document.querySelectorAll("[data-i18n]")) {
    element.textContent = translate(language, element.dataset.i18n);
  }
  for (const element of document.querySelectorAll("[data-i18n-placeholder]")) {
    element.placeholder = translate(language, element.dataset.i18nPlaceholder);
  }
  for (const element of document.querySelectorAll("[data-i18n-title]")) {
    element.title = element.ariaLabel = translate(language, element.dataset.i18nTitle);
  }
  for (const button of document.querySelectorAll("[data-lang]")) {
    button.setAttribute("aria-pressed", String(button.dataset.lang === language));
  }
}
