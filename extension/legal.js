const copies = document.querySelectorAll("[data-legal-copy]");
const buttons = document.querySelectorAll("[data-legal-lang]");

function setLanguage(language) {
  const selected = language === "ru" ? "ru" : "en";
  document.documentElement.lang = selected;
  document.title = selected === "ru"
    ? "Конфиденциальность и условия — Fast Search"
    : "Privacy & Legal — Fast Search";
  for (const section of copies) section.hidden = section.dataset.legalCopy !== selected;
  for (const label of document.querySelectorAll("[data-back]")) {
    label.hidden = label.dataset.back !== selected;
  }
  for (const button of buttons) {
    button.setAttribute("aria-pressed", String(button.dataset.legalLang === selected));
  }
}

for (const button of buttons) {
  button.addEventListener("click", async () => {
    const language = button.dataset.legalLang;
    setLanguage(language);
    try { await browser.storage.local.set({ uiLanguage: language }); }
    catch (error) { console.warn("Language preference was not saved", error); }
  });
}

void browser.storage.local.get("uiLanguage").then(settings => {
  setLanguage(settings.uiLanguage ||
    (browser.i18n.getUILanguage().toLowerCase().startsWith("ru") ? "ru" : "en"));
}).catch(() => setLanguage("en"));
