(function () {
  function nativeCheck(input) {
    if (!input) return;
    if ((input.type || "").toLowerCase() === "checkbox") return;
    const desc = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "checked");
    const tracker = input._valueTracker;
    if (tracker) tracker.setValue(input.checked ? "true" : "false");
    if (desc?.set) desc.set.call(input, true);
    else input.checked = true;
    input.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function resolveInput(marked) {
    if (marked.matches?.("input[type='radio'], input[type='checkbox']")) return marked;
    const nested = marked.querySelector?.("input[type='radio'], input[type='checkbox']");
    if (nested) return nested;
    if (marked.htmlFor) return document.getElementById(marked.htmlFor);
    const wrap = marked.closest?.("label");
    return wrap?.querySelector("input[type='radio'], input[type='checkbox']") || null;
  }

  document.addEventListener("applyfill-act", () => {
    const marked = document.querySelector("[data-applyfill-hit]");
    if (!marked) return;
    const input = resolveInput(marked);
    if ((input?.type || "").toLowerCase() === "checkbox") return;
    const label = marked.closest("label")
      || (input?.id ? document.querySelector(`label[for="${CSS.escape(input.id)}"]`) : null);
    if (label) label.click();
    nativeCheck(input);
    if (!input) marked.click();
  }, true);
})();
