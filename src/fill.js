(function (root) {
  function nativeSet(el, value) {
    if (el.tagName !== "INPUT" && el.tagName !== "TEXTAREA") {
      if ("value" in el) el.value = value;
      return;
    }
    const proto = el.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const descriptor = Object.getOwnPropertyDescriptor(proto, "value");
    const tracker = el._valueTracker;
    if (tracker) tracker.setValue("");
    if (descriptor?.set) descriptor.set.call(el, value);
    else el.value = value;
  }

  function fire(el) {
    el.dispatchEvent(new Event("focus", { bubbles: true }));
    el.dispatchEvent(new InputEvent("input", { bubbles: true, composed: true, data: el.value }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    el.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Enter" }));
    el.dispatchEvent(new Event("blur", { bubbles: true }));
  }

  function press(el) {
    if (!el) return;
    try { el.scrollIntoView({ block: "nearest", inline: "nearest" }); } catch { /* ignore */ }
    const rect = el.getBoundingClientRect();
    const x = rect.left + Math.min(12, Math.max(6, rect.width / 2));
    const y = rect.top + rect.height / 2;
    const mouse = {
      bubbles: true, cancelable: true, composed: true, view: window,
      clientX: x, clientY: y, screenX: x, screenY: y, button: 0, buttons: 1,
    };
    const pointer = { ...mouse, pointerId: 1, pointerType: "mouse", isPrimary: true };
    try { el.focus({ preventScroll: true }); } catch { /* ignore */ }
    el.dispatchEvent(new PointerEvent("pointerdown", pointer));
    el.dispatchEvent(new MouseEvent("mousedown", mouse));
    el.dispatchEvent(new PointerEvent("pointerup", { ...pointer, buttons: 0 }));
    el.dispatchEvent(new MouseEvent("mouseup", { ...mouse, buttons: 0 }));
    el.dispatchEvent(new MouseEvent("click", { ...mouse, buttons: 0 }));
    if (typeof el.click === "function") el.click();
  }

  function tap(el) {
    press(el);
  }

  function toTabViewport(x, y) {
    let ax = x;
    let ay = y;
    let win = window;
    while (win !== win.top) {
      try {
        const frame = win.frameElement;
        if (!frame) break;
        const rect = frame.getBoundingClientRect();
        ax += rect.left;
        ay += rect.top;
        win = win.parent;
      } catch {
        break;
      }
    }
    return { x: ax, y: ay };
  }

  function radioClickPoints(el) {
    const rect = el.getBoundingClientRect();
    const y = rect.top + rect.height / 2;
    const circle = toTabViewport(rect.left + Math.min(10, Math.max(6, rect.width / 2)), y);
    const caption = rect.width < 48
      ? toTabViewport(rect.right + 18, y)
      : toTabViewport(rect.left + 28, y);
    return [circle, caption];
  }

  function visibleAgreeTarget(el) {
    const row = el.closest("label, [class*='checkbox' i], [class*='form-item' i], [role='checkbox']") || el;
    const nodes = [row, el, ...[...(row?.querySelectorAll("span, i, svg, div, input") || [])]];
    let best = null;
    for (const node of nodes) {
      const rect = node.getBoundingClientRect();
      if (rect.width < 10 || rect.height < 10 || rect.width > 48 || rect.height > 48) continue;
      if (!best || rect.left < best.getBoundingClientRect().left) best = node;
    }
    if (best) return best;
    const rect = row.getBoundingClientRect();
    if (rect.width > 12 && rect.height > 12) return row;
    return el;
  }

  function agreeClickPoints(el) {
    const target = visibleAgreeTarget(el);
    const rect = target.getBoundingClientRect();
    const y = rect.top + Math.min(Math.max(rect.height / 2, 8), 16);
    if (rect.width > 48) {
      return [
        toTabViewport(rect.left + 10, y),
        toTabViewport(rect.left + 22, y),
      ];
    }
    return [
      toTabViewport(rect.left + Math.min(10, Math.max(6, rect.width / 2)), y),
      toTabViewport(rect.right + 12, y),
    ];
  }

  async function selectRadioOnPage(el, kind) {
    if (!el) return false;
    try { el.scrollIntoView({ block: "center", inline: "nearest" }); } catch { /* ignore */ }
    await wait(50);
    if (!chrome?.runtime?.sendMessage) {
      press(el);
      return true;
    }
    const marker = `af${Date.now().toString(36)}${Math.random().toString(16).slice(2, 8)}`;
    el.setAttribute("data-applyfill-hit", marker);
    const points = kind === "agree" ? agreeClickPoints(el) : radioClickPoints(el);
    try {
      await chrome.runtime.sendMessage({ type: "SELECT_RADIO", marker, points, kind: kind || "radio" });
    } catch {
      press(el);
      document.dispatchEvent(new CustomEvent("applyfill-act", { bubbles: true, composed: true }));
    }
    el.removeAttribute("data-applyfill-hit");
    return true;
  }

  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function displayedText(el) {
    if (el.tagName === "SELECT") return (el.options[el.selectedIndex]?.text || el.value || "").trim();
    const valueSpan = el.querySelector(".value, [data-value], [class*='selected' i]");
    return String(
      el.value ||
      el.getAttribute("aria-valuetext") ||
      valueSpan?.innerText ||
      el.innerText ||
      ""
    ).replace(/\s+/g, " ").trim();
  }

  function currentValue(el) {
    if (el.type === "checkbox" || el.type === "radio") return el.checked ? el.value || "on" : "";
    const text = displayedText(el);
    if (!text) return "";
    if (/select\b|choose\b|country\/regio/i.test(text) && text.length < 56) return "";
    if (/^-+$/.test(text)) return "";
    if (/^(email|e-mail|phone|mobile|name|legal name|first name|last name|gender|city|state)$/i.test(text)) return "";
    return text;
  }

  function yesNo(value) {
    const text = String(value || "").trim().toLowerCase();
    if (["yes", "y", "true", "authorized", "1"].includes(text)) return "yes";
    if (["no", "n", "false", "0"].includes(text)) return "no";
    return text;
  }

  function chooseOption(select, raw) {
    const wanted = String(raw || "").trim().toLowerCase();
    const yn = yesNo(raw);
    const options = [...select.options];
    const exact = options.find((opt) => opt.value.toLowerCase() === wanted || opt.text.toLowerCase().trim() === wanted);
    if (exact) return exact.value;
    const fuzzy = options.find((opt) => {
      const label = `${opt.value} ${opt.text}`.toLowerCase();
      if (yn === "yes") return /\byes\b|authorized|eligible|citizen|permanent/.test(label) && !/not |no\b|sponsor/.test(label);
      if (yn === "no") return /\bno\b|not a protected|do not have|ineligible/.test(label);
      return label.includes(wanted) || wanted.includes(opt.text.toLowerCase().trim());
    });
    return fuzzy ? fuzzy.value : null;
  }

  function optionCaption(el) {
    if (el.value && /^(yes|no)$/i.test(el.value)) return el.value;
    const own = (el.innerText || el.textContent || "").trim().split(/\n/).map((part) => part.trim()).find((part) => /^(yes|no)$/i.test(part));
    if (own) return own;
    const id = el.id || "";
    const forLabel = id ? document.querySelector(`label[for="${CSS.escape(id)}"]`) : null;
    if (forLabel) {
      const line = forLabel.innerText.trim().split(/\n/).map((part) => part.trim()).find((part) => /^(yes|no)$/i.test(part));
      if (line) return line;
      if (forLabel.innerText.trim().length < 40) return forLabel.innerText.trim();
    }
    const wrap = el.closest("label");
    if (wrap) {
      const line = wrap.innerText.trim().split(/\n/).map((part) => part.trim()).find((part) => /^(yes|no)$/i.test(part));
      if (line) return line;
    }
    const sibling = (el.nextElementSibling?.innerText || el.nextSibling?.textContent || "").trim();
    if (sibling) return sibling.split(/\s+/)[0];
    return el.getAttribute("aria-label") || "";
  }

  function isAgreeBox(el) {
    if (!el) return false;
    if (root.ApplyFillMatcher.isAgreeWidget?.(el)) return true;
    if ((el.type || "").toLowerCase() === "checkbox") return true;
    if ((el.getAttribute("role") || "").toLowerCase() === "checkbox") return true;
    return Boolean(el.querySelector?.("input[type='checkbox'], [role='checkbox']"));
  }

  function isAgreeChecked(el) {
    const input = (el.type || "").toLowerCase() === "checkbox" ? el : el.querySelector?.("input[type='checkbox']");
    if (input) return Boolean(input.checked);
    const box = (el.getAttribute("role") || "").toLowerCase() === "checkbox"
      ? el
      : el.querySelector?.("[role='checkbox']") || el.closest?.("[role='checkbox']");
    if (box?.getAttribute?.("aria-checked") === "true") return true;
    const row = el.closest?.("[class*='checkbox' i]") || el;
    if (/checked|selected|active/i.test(`${row.className || ""} ${row.getAttribute?.("aria-checked") || ""}`)) return true;
    return false;
  }

  function isYesNoSelected(target, yn) {
    if (!target) return false;
    if (isAgreeBox(target)) return yn === "yes" ? isAgreeChecked(target) : !isAgreeChecked(target);
    const input = target.matches?.("input[type='radio']") ? target : target.querySelector?.("input[type='radio']");
    if (input?.checked) {
      const cap = optionCaption(input).toLowerCase();
      if (!cap || cap === yn) return true;
      if (/^(yes|no)$/i.test(input.value || "")) return input.value.toLowerCase() === yn;
      return true;
    }
    const row = target.closest?.("[role='radio']") || target;
    if (row.getAttribute?.("aria-checked") === "true") return true;
    const pair = yesNoPair(target);
    const chosen = pair[yn];
    if (chosen?.getAttribute?.("aria-checked") === "true") return true;
    if (chosen?.querySelector?.("input[type='radio']")?.checked) return true;
    return false;
  }

  function choiceClickables(target) {
    const input = target.matches?.("input[type='radio']") ? target : target.querySelector?.("input[type='radio']");
    const label = target.closest?.("label")
      || (input?.id ? document.querySelector(`label[for="${CSS.escape(input.id)}"]`) : null)
      || target;
    const row = target.closest?.("[role='radio'], [class*='radio' i], label") || label;
    const text = [...(row?.querySelectorAll("span, p, div, strong, label") || [])].find((node) =>
      /^(yes|no)$/i.test((node.innerText || "").replace(/\s+/g, " ").trim())
    );
    return uniqueClicks([label, row, text, input, target].filter(Boolean));
  }

  async function setYesNo(el, raw) {
    const yn = yesNo(raw);
    if (yn !== "yes" && yn !== "no") return false;

    if (isAgreeBox(el)) {
      const should = yn === "yes";
      if (isAgreeChecked(el) === should) return true;
      const box = (el.type || "").toLowerCase() === "checkbox" || (el.getAttribute("role") || "").toLowerCase() === "checkbox"
        ? el
        : el.querySelector("input[type='checkbox'], [role='checkbox']") || el;
      const clickEl = visibleAgreeTarget(box);
      await selectRadioOnPage(clickEl, "agree");
      await wait(280);
      return isAgreeChecked(el) === should;
    }

    const pair = yesNoPair(el);
    const target = pair[yn] || el;
    if (isYesNoSelected(target, yn)) return true;

    const spots = choiceClickables(target);
    const preferred = spots.find((spot) => /^(yes|no)$/i.test((spot.innerText || "").replace(/\s+/g, " ").trim()))
      || spots[0]
      || target;

    await selectRadioOnPage(preferred);
    await wait(180);
    if (isYesNoSelected(target, yn)) return true;

    for (const spot of spots) {
      if (spot === preferred) continue;
      await selectRadioOnPage(spot);
      await wait(160);
      if (isYesNoSelected(target, yn)) return true;
    }
    await wait(120);
    return isYesNoSelected(target, yn);
  }

  function yesNoPair(el) {
    let node = el;
    for (let i = 0; i < 8 && node && node !== document.body; i += 1) {
      const pair = yesNoClicks(node);
      if (pair.yes && pair.no) return pair;
      node = node.parentElement;
    }
    return yesNoClicks(el.parentElement || el);
  }

  function yesNoClicks(root) {
    const result = { yes: null, no: null };
    if (!root?.querySelectorAll) return result;
    const found = { yes: [], no: [] };
    const nodes = [...root.querySelectorAll("input[type='radio'], [role='radio'], label, button")];
    if (root.matches?.("input[type='radio'], [role='radio'], label, button")) nodes.unshift(root);
    for (const node of nodes) {
      const cap = optionCaption(node).toLowerCase().trim();
      if (cap !== "yes" && cap !== "no") continue;
      found[cap].push(node.closest("label") || node);
    }
    const yes = uniqueClicks(found.yes);
    const no = uniqueClicks(found.no);
    if (yes.length === 1 && no.length === 1) {
      result.yes = yes[0];
      result.no = no[0];
    }
    return result;
  }

  function uniqueClicks(nodes) {
    const unique = [];
    for (const node of nodes) {
      if (unique.some((other) => other === node || other.contains(node) || node.contains(other))) continue;
      unique.push(node);
    }
    return unique;
  }
  function setRadioOrCheckbox(el, raw) {
    const yn = yesNo(raw);
    const caption = optionCaption(el).toLowerCase();
    if (el.type === "checkbox") {
      const shouldCheck = yn === "yes" || yn === "true" || caption.includes(String(raw).toLowerCase());
      if (el.checked === shouldCheck) return false;
      el.checked = shouldCheck;
      fire(el);
      return true;
    }
    const match =
      (yn === "yes" && /^(yes|authorized|true)$/i.test(caption)) ||
      (yn === "no" && /^(no|false)$/i.test(caption)) ||
      caption === String(raw).toLowerCase();
    if (!match || el.checked) return false;
    el.checked = true;
    fire(el);
    return true;
  }

  function distance(a, b) {
    if (a === b) return 0;
    if (Math.abs(a.length - b.length) > 2) return 9;
    const rows = Array.from({ length: a.length + 1 }, (_, i) => {
      const row = new Array(b.length + 1);
      row[0] = i;
      return row;
    });
    for (let j = 0; j <= b.length; j += 1) rows[0][j] = j;
    for (let i = 1; i <= a.length; i += 1) {
      for (let j = 1; j <= b.length; j += 1) {
        rows[i][j] = Math.min(
          rows[i - 1][j] + 1,
          rows[i][j - 1] + 1,
          rows[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
        );
      }
    }
    return rows[a.length][b.length];
  }

  function optionMatches(text, wanted, yn) {
    const t = String(text || "").replace(/\s+/g, " ").trim().toLowerCase();
    const w = String(wanted || "").replace(/\s+/g, " ").trim().toLowerCase();
    if (!t || t.length > 220 || /^(select|next|previous|- select)/i.test(t)) return 0;
    if (t === w) return 4;
    if (/\b(mobile|cell|cellular)\b/.test(w) && /\b(mobile|cell|cellular)\b/.test(t) && !/select/.test(t)) return 3;
    if (w.length > 4 && distance(t, w) <= 2) return 3;
    if (w.length > 2 && (t.includes(w) || w.includes(t))) return 2;
    if (yn === "yes" && t === "yes") return 1;
    if (yn === "no" && t === "no") return 1;
    return 0;
  }

  function menuChoices() {
    const nodes = document.querySelectorAll([
      "[role='option']",
      "[role='menuitem']",
      "[role='listbox'] li",
      "[role='listbox'] button",
      "ul[role='listbox'] > *",
      "[class*='dropdown' i] li",
      "[class*='menu' i] li",
      "[class*='option' i]",
      "[class*='tds-list'] li",
    ].join(","));
    return [...nodes].filter((el) => {
      if (el.closest("#applyfill-host")) return false;
      if (el.hidden || el.closest("[hidden]")) return false;
      const text = (el.innerText || "").replace(/\s+/g, " ").trim();
      if (!text || text.length > 180) return false;
      const rect = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      return rect.width > 8 && rect.height > 8 && style.visibility !== "hidden" && style.display !== "none";
    });
  }

  function clickTarget(el) {
    if (root.ApplyFillMatcher.isSelectPlaceholder(el)) {
      return el.closest("button, [role='combobox'], [aria-haspopup], [class*='select' i], [class*='Select']") || el.parentElement || el;
    }
    return el.closest("button, [role='combobox'], [aria-haspopup], select") ||
      el.parentElement?.querySelector("button, [role='combobox']") ||
      el;
  }

  function nearbyMenuChoices(target) {
    const items = menuChoices();
    const tr = target.getBoundingClientRect();
    const local = items.filter((opt) => {
      const r = opt.getBoundingClientRect();
      if (r.bottom < tr.top - 12) return false;
      if (r.top > tr.bottom + 420) return false;
      return Math.abs(r.left - tr.left) < 480;
    });
    return local.length ? local : items;
  }

  function visibleChooser(el) {
    const M = root.ApplyFillMatcher;
    if (!M.isHiddenish?.(el)) return clickTarget(el);
    const wrap = el.parentElement;
    if (!wrap) return clickTarget(el);
    const visible = [...wrap.querySelectorAll("button, [role='combobox'], [aria-haspopup], [class*='select' i]")].find((node) => {
      if (node === el) return false;
      if (M.isHiddenish(node)) return false;
      const rect = node.getBoundingClientRect();
      return rect.width > 24 && rect.height > 12;
    });
    return visible || clickTarget(el);
  }

  function looksSelected(el, wanted) {
    const shown = displayedText(clickTarget(el) || el);
    return optionMatches(shown, wanted, yesNo(wanted)) >= 2;
  }

  function bestChoice(items, wanted, yn) {
    let best = null;
    for (const opt of items) {
      const rank = optionMatches(opt.innerText, wanted, yn);
      if (rank && (!best || rank > best.rank)) best = { opt, rank };
    }
    return best;
  }

  async function pickFromList(el, raw) {
    const wanted = String(raw || "").trim();
    const yn = yesNo(raw);
    if (!wanted) return false;
    if (looksSelected(el, wanted)) return true;

    const target = visibleChooser(el);
    const already = bestChoice(nearbyMenuChoices(target), wanted, yn);
    if (already && already.rank >= 2) {
      await selectRadioOnPage(already.opt);
      await wait(160);
      if (looksSelected(el, wanted) || looksSelected(target, wanted)) return true;
    }

    const before = new Set(menuChoices());
    tap(target);
    await wait(320);

    const after = nearbyMenuChoices(target);
    const fresh = after.filter((item) => !before.has(item));
    const candidates = fresh.length ? fresh : after;
    let hit = bestChoice(candidates, wanted, yn);

    if (hit) {
      await selectRadioOnPage(hit.opt);
      await wait(160);
      tap(hit.opt);
      await wait(80);
      return looksSelected(el, wanted) || looksSelected(target, wanted);
    }

    if (candidates.length > 8) {
      for (const letter of wanted.slice(0, 18)) {
        target.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: letter, cancelable: true }));
      }
      await wait(200);
      hit = bestChoice(menuChoices(), wanted, yn);
      if (hit) {
        await selectRadioOnPage(hit.opt);
        await wait(160);
        tap(hit.opt);
        await wait(80);
        return looksSelected(el, wanted) || looksSelected(target, wanted);
      }
      target.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Enter" }));
      await wait(80);
      return looksSelected(el, wanted) || looksSelected(target, wanted);
    }

    return false;
  }

  function controlMode(el, match) {
    const M = root.ApplyFillMatcher;
    if (M.isDateControl(el) || match.key === "internStartDate") return "skip";
    if (M.isChooser(el) || el.tagName === "SELECT" || M.isSelectPlaceholder(el)) return "dropdown";
    if (M.isRadioLike(el) || M.isYesNoChoice(el) || (M.YES_NO_KEYS.has(match.key) && !M.isChooser(el))) return "yesno";
    if (M.DROPDOWN_KEYS.has(match.key)) return "dropdown";
    return "text";
  }

  async function applyOne(el, match, value, settings, used) {
    if (used.has(match.key)) return null;
    const mode = controlMode(el, match);
    if (mode === "skip") return null;
    const skipFilled = settings?.skipFilled !== false;
    const fieldMeta = root.ApplyFillProfile.FIELDS.find((item) => item.key === match.key);
    const existing = currentValue(el);
    if (skipFilled && existing && mode === "dropdown" && looksSelected(el, value)) return null;
    if (skipFilled && mode === "yesno" && isYesNoSelected(el, yesNo(value))) return null;
    if (skipFilled && existing && mode === "text") {
      const leftoverState = match.key === "fullName" && /^[A-Za-z]{2}$/.test(existing.trim());
      if (!leftoverState) return null;
    }

    let inserted = false;
    if (mode === "yesno") {
      inserted = await setYesNo(el, value);
    } else if (mode === "dropdown") {
      if (el.tagName === "SELECT") {
        const option = chooseOption(el, value);
        if (option != null) {
          el.value = option;
          fire(el);
        }
      }
      inserted = await pickFromList(el, value) || looksSelected(el, value);
    } else if (el.tagName === "SELECT") {
      const option = chooseOption(el, value);
      if (option == null) return null;
      el.value = option;
      fire(el);
      inserted = true;
    } else {
      nativeSet(el, value);
      fire(el);
      inserted = true;
    }

    if (!inserted) return null;
    used.add(match.key);
    const marked = mode === "yesno"
      ? (isAgreeBox(el) ? el : (yesNoPair(el)[yesNo(value)] || el))
      : el;
    marked.setAttribute("data-applyfill", match.key);
    return {
      key: match.key,
      label: fieldMeta?.label || match.key,
      value,
      section: match.section || fieldMeta?.section || "Application",
      via: match.via,
    };
  }

  async function fill(doc, profile, settings) {
    const nodes = root.ApplyFillMatcher.collectFields(doc);
    const used = new Set();
    const results = [];
    const dropdowns = [];
    const choices = [];
    const rest = [];

    for (const el of nodes) {
      const match = root.ApplyFillMatcher.matchField(el);
      if (!match) continue;
      const value = String(profile[match.key] || "").trim();
      if (!value) continue;
      const mode = controlMode(el, match);
      if (mode === "skip") continue;
      if (mode === "dropdown") dropdowns.push({ el, match, value });
      else if (mode === "yesno") choices.push({ el, match, value });
      else rest.push({ el, match, value });
    }

    if (choices.length || dropdowns.length) {
      if (chrome?.runtime?.sendMessage) {
        try { await chrome.runtime.sendMessage({ type: "DEBUGGER_ATTACH" }); } catch { /* ignore */ }
      }
    }
    try {
      for (const item of dropdowns) {
        const row = await applyOne(item.el, item.match, item.value, settings || {}, used);
        if (row) results.push(row);
      }
      for (const item of choices) {
        const row = await applyOne(item.el, item.match, item.value, settings || {}, used);
        if (row) results.push(row);
      }
    } finally {
      if ((choices.length || dropdowns.length) && chrome?.runtime?.sendMessage) {
        try { await chrome.runtime.sendMessage({ type: "DEBUGGER_DETACH" }); } catch { /* ignore */ }
      }
    }

    for (const item of rest) {
      const row = await applyOne(item.el, item.match, item.value, settings || {}, used);
      if (row) results.push(row);
    }

    return results;
  }

  root.ApplyFill = { fill, nativeSet, fire };
})(typeof globalThis !== "undefined" ? globalThis : window);
