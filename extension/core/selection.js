// Runs in a page frame via scripting.executeScript; keep this function self-contained.
export function readSelection() {
  let element = document.activeElement;
  while (element?.shadowRoot?.activeElement) element = element.shadowRoot.activeElement;
  let text = "";
  const editableInput = element?.tagName === "TEXTAREA" ||
    (element?.tagName === "INPUT" && ["text", "search", "url", "tel"].includes(element.type));
  if (editableInput && typeof element.selectionStart === "number") {
    text = element.value.slice(element.selectionStart, element.selectionEnd);
  } else {
    text = element?.getRootNode?.().getSelection?.()?.toString() ||
      window.getSelection()?.toString() || "";
  }
  return { text, focused: document.hasFocus() };
}

export function preferFocusedSelection(results) {
  const selections = results.map(item => item?.result)
    .filter(result => typeof result?.text === "string" && result.text.trim());
  return (selections.find(result => result.focused) ?? selections[0])?.text ?? "";
}
