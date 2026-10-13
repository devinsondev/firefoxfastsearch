import { applyToolbarIcon } from "../core/icon.js";

export function setupIconPicker(api, notify) {
  const zone = document.getElementById("iconDrop");
  const fileInput = document.getElementById("iconFile");
  const preview = document.getElementById("iconPreview");
  const reset = document.getElementById("resetIcon");

  async function onFile(file) {
    if (!file || !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
        file.size > 5 * 1024 * 1024) throw new Error("invalidIcon");
    const bitmap = await createImageBitmap(file);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 128;
      const ctx = canvas.getContext("2d");
      const size = Math.min(128 / bitmap.width, 128 / bitmap.height);
      const width = bitmap.width * size, height = bitmap.height * size;
      ctx.drawImage(bitmap, (128 - width) / 2, (128 - height) / 2, width, height);
      const dataUrl = canvas.toDataURL("image/png");
      await applyToolbarIcon(api, dataUrl);
      await api.storage.local.set({ toolbarIcon: dataUrl });
      preview.src = dataUrl;
      notify("iconSaved");
    } finally { bitmap.close(); }
  }
  async function changeIcon(file) {
    try { await onFile(file); }
    catch (error) { notify(error.message === "invalidIcon" ? "invalidIcon" : String(error), true); }
  }
  zone.addEventListener("click", () => fileInput.click());
  zone.addEventListener("keydown", event => {
    if (event.key === "Enter" || event.key === " ") { event.preventDefault(); fileInput.click(); }
  });
  fileInput.addEventListener("change", () => { void changeIcon(fileInput.files[0]); fileInput.value = ""; });
  zone.addEventListener("dragover", event => { event.preventDefault(); zone.classList.add("over"); });
  zone.addEventListener("dragleave", () => zone.classList.remove("over"));
  zone.addEventListener("drop", event => {
    event.preventDefault(); zone.classList.remove("over");
    void changeIcon(event.dataTransfer?.files[0]);
  });
  reset.addEventListener("click", async () => {
    try {
      await applyToolbarIcon(api, null);
      await api.storage.local.remove("toolbarIcon");
      preview.src = "icons/icon.png";
      notify("iconReset");
    } catch (error) { notify(String(error), true); }
  });
  void api.storage.local.get("toolbarIcon").then(settings => {
    if (settings.toolbarIcon) preview.src = settings.toolbarIcon;
  });
}
