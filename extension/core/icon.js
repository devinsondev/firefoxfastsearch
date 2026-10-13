// Stored icon overrides the toolbar icon only; manifest icon stays on disk.
export async function applyToolbarIcon(api, dataUrl) {
  if (!dataUrl) {
    await api.action.setIcon({ path: "icons/icon.png" });
    return;
  }
  if (!/^data:image\/png;base64,[a-z\d+/=]+$/i.test(dataUrl) || dataUrl.length > 700000) {
    throw new Error("Invalid saved icon");
  }
  const blob = await (await fetch(dataUrl)).blob();
  const bitmap = await createImageBitmap(blob);
  try {
    const imageData = {};
    for (const size of [16, 32, 64]) {
      const canvas = new OffscreenCanvas(size, size);
      const context = canvas.getContext("2d");
      context.drawImage(bitmap, 0, 0, size, size);
      imageData[size] = context.getImageData(0, 0, size, size);
    }
    await api.action.setIcon({ imageData });
  } finally {
    bitmap.close();
  }
}
