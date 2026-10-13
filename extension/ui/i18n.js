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
    disclosureHeading: "Передача текста",
    disclosureText: "При нажатии горячей клавиши выделенный текст уходит выбранному поисковику и может сохраниться в истории браузера. Не отправляй пароли и секреты.",
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
    popupDisclosure: "Выделенный текст отправляется выбранному поисковику. Не используй для секретов.",
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
    disclosureHeading: "Sending selected text",
    disclosureText: "When you use a shortcut, selected text is sent to the chosen search provider and may appear in browser history. Do not search for passwords or secrets.",
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
    popupDisclosure: "Selected text is sent to your search provider. Avoid secrets.",
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
