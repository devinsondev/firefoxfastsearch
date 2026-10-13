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
    iconHeading: "Иконка расширения",
    iconHelp: "Перетащи PNG, JPG или WebP — иконка на панели сменится сразу.",
    dropImage: "Перетащи картинку или нажми здесь",
    iconLimit: "До 5 МБ; изображение впишется в квадрат",
    resetIcon: "Вернуть стандартную",
    iconNote: "Для иконки в about:addons замени extension/icons/icon.png и перезагрузи расширение.",
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
    iconSaved: "Иконка панели обновлена.", iconReset: "Стандартная иконка восстановлена.",
    invalidIcon: "Выбери PNG, JPG или WebP размером до 5 МБ.",
    confirmDelete: "Удалить этот профиль и его клавишу?",
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
    iconHeading: "Extension icon",
    iconHelp: "Drop PNG, JPG or WebP to update the toolbar icon instantly.",
    dropImage: "Drop an image or click to browse", iconLimit: "Up to 5 MB; fitted into a square",
    resetIcon: "Restore default", iconNote: "For the about:addons icon too, replace extension/icons/icon.png and reload the extension.",
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
    iconSaved: "Toolbar icon updated.", iconReset: "Default icon restored.",
    invalidIcon: "Use a PNG, JPG or WebP file under 5 MB.",
    confirmDelete: "Delete this profile and its shortcut?",
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
