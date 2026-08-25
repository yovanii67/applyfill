const KNOWN = [
  "tesla.com",
  "greenhouse.io", "lever.co", "myworkdayjobs.com", "workday.com", "ashbyhq.com",
  "icims.com", "smartrecruiters.com", "jobvite.com", "taleo.net", "linkedin.com",
  "indeed.com", "joinhandshake.com", "workable.com", "breezy.hr", "rippling.com",
];

async function fillActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return { error: "No active tab." };
  const url = tab.url || "";
  if (!/^https?:/.test(url) && !url.startsWith(`chrome-extension://${chrome.runtime.id}`)) {
    return { error: "Open an application page first (http/https)." };
  }

  const frames = await chrome.webNavigation.getAllFrames({ tabId: tab.id }).catch(() => [{ frameId: 0 }]);
  const ordered = [...(frames || [{ frameId: 0 }])].sort((a, b) => (a.frameId === 0 ? -1 : b.frameId === 0 ? 1 : 0));
  const collected = [];
  let platform = { id: "generic", label: "This site" };

  async function fillFrames(list) {
    for (const frame of list) {
      try {
        const response = await chrome.tabs.sendMessage(tab.id, { type: "FILL" }, { frameId: frame.frameId });
        if (response?.results?.length) collected.push(...response.results);
        if (response?.platform?.id && response.platform.id !== "generic") platform = response.platform;
      } catch {
        // Frame may not have the content script (chrome://, pdf, etc).
      }
    }
  }

  await fillFrames(ordered.filter((frame) => frame.frameId === 0));
  if (!collected.length) await fillFrames(ordered.filter((frame) => frame.frameId !== 0));

  if (!collected.length) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id, allFrames: true },
        files: ["src/profile.js", "src/matcher.js", "src/fill.js", "src/content.js"],
      });
      const retryFrames = await chrome.webNavigation.getAllFrames({ tabId: tab.id }).catch(() => [{ frameId: 0 }]);
      const retryOrdered = [...(retryFrames || [{ frameId: 0 }])].sort((a, b) => (a.frameId === 0 ? -1 : b.frameId === 0 ? 1 : 0));
      await fillFrames(retryOrdered.filter((frame) => frame.frameId === 0));
      if (!collected.length) await fillFrames(retryOrdered.filter((frame) => frame.frameId !== 0));
    } catch (error) {
      return { error: error.message || "Could not reach this page." };
    }
  }

  const payload = { results: collected, platform };
  try {
    await chrome.tabs.sendMessage(tab.id, { type: "SHOW_HUD", payload });
  } catch {
    // Top frame HUD is best-effort.
  }
  return payload;
}

let debuggerTab = null;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function debuggerAttach(tabId) {
  if (debuggerTab === tabId) return true;
  if (debuggerTab != null) {
    try { await chrome.debugger.detach({ tabId: debuggerTab }); } catch { /* ignore */ }
    debuggerTab = null;
  }
  try {
    await chrome.debugger.attach({ tabId }, "1.3");
    debuggerTab = tabId;
    return true;
  } catch (error) {
    const text = String(error?.message || error);
    if (/already attached/i.test(text)) {
      debuggerTab = tabId;
      return true;
    }
    return false;
  }
}

async function debuggerDetach(tabId) {
  const id = tabId || debuggerTab;
  if (id == null) return;
  try { await chrome.debugger.detach({ tabId: id }); } catch { /* ignore */ }
  if (debuggerTab === id) debuggerTab = null;
}

async function mouseClick(tabId, x, y) {
  const point = { x: Math.round(x), y: Math.round(y) };
  await chrome.debugger.sendCommand({ tabId }, "Input.dispatchMouseEvent", {
    type: "mouseMoved", ...point,
  });
  await chrome.debugger.sendCommand({ tabId }, "Input.dispatchMouseEvent", {
    type: "mousePressed", button: "left", buttons: 1, clickCount: 1, ...point,
  });
  await chrome.debugger.sendCommand({ tabId }, "Input.dispatchMouseEvent", {
    type: "mouseReleased", button: "left", buttons: 0, clickCount: 1, ...point,
  });
}

function activateMarkedRadio(marker) {
  const marked = document.querySelector(`[data-applyfill-hit="${marker}"]`);
  if (!marked) return false;
  const input = marked.matches("input[type='radio'], input[type='checkbox']")
    ? marked
    : marked.querySelector("input[type='radio'], input[type='checkbox']")
      || (marked.htmlFor ? document.getElementById(marked.htmlFor) : null)
      || marked.closest("label")?.querySelector("input[type='radio'], input[type='checkbox']");
  const label = marked.closest("label")
    || (input?.id ? document.querySelector(`label[for="${CSS.escape(input.id)}"]`) : null);
  if (input?.type === "checkbox") return false;
  if (label && input?.type !== "checkbox") label.click();
  if (input) {
    const desc = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "checked");
    const tracker = input._valueTracker;
    if (tracker) tracker.setValue(String(Boolean(input.checked)));
    if (desc?.set) desc.set.call(input, true);
    else input.checked = true;
    input.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  } else {
    marked.click();
  }
  return Boolean(input?.checked || marked.getAttribute("aria-checked") === "true");
}

async function selectRadio(tabId, frameId, marker, points, kind) {
  if (kind !== "agree") {
    try {
      const target = { tabId };
      if (Number.isInteger(frameId)) target.frameIds = [frameId];
      await chrome.scripting.executeScript({
        target,
        world: "MAIN",
        func: activateMarkedRadio,
        args: [marker],
      });
    } catch {
      // Page may block script injection; mouse click still runs.
    }
  }

  const attached = await debuggerAttach(tabId);
  if (!attached) return { ok: false };
  for (const point of points || []) {
    if (point?.x == null || point?.y == null) continue;
    try {
      await mouseClick(tabId, point.x, point.y);
      await delay(60);
    } catch {
      // Coordinate click failed for this point.
    }
  }
  return { ok: true, via: "mouse" };
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "FILL_ACTIVE_TAB") {
    fillActiveTab().then(sendResponse);
    return true;
  }
  if (message.type === "DEBUGGER_ATTACH") {
    debuggerAttach(sender.tab?.id).then((ok) => sendResponse({ ok }));
    return true;
  }
  if (message.type === "DEBUGGER_DETACH") {
    debuggerDetach(sender.tab?.id).then(() => sendResponse({ ok: true }));
    return true;
  }
  if (message.type === "SELECT_RADIO") {
    selectRadio(sender.tab?.id, sender.frameId, message.marker, message.points, message.kind).then(sendResponse);
    return true;
  }
});

chrome.commands.onCommand.addListener((command) => {
  if (command === "fill-page") fillActiveTab();
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(["settings"], ({ settings }) => {
    if (!settings) chrome.storage.local.set({ settings: { autoFillAts: false, skipFilled: true, showFab: true } });
  });
});

function isAts(url) {
  return KNOWN.some((host) => (url || "").includes(host));
}

chrome.webNavigation.onCompleted.addListener((details) => {
  if (details.frameId !== 0 || !isAts(details.url)) return;
  chrome.storage.local.get(["settings"], ({ settings }) => {
    if (settings?.autoFillAts) fillActiveTab();
  });
});
