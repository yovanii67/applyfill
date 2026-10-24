const HOST_ID = "applyfill-host";
let reviewOpen = false;
let fabSpot = null;
let shortcutAt = 0;

function isTop() {
  try {
    return window === window.top;
  } catch {
    return true;
  }
}

async function loadState() {
  const { profile, settings } = await chrome.storage.local.get(["profile", "settings"]);
  return {
    profile: ApplyFillProfile.derive({ ...ApplyFillProfile.DEFAULTS, ...(profile || {}) }),
    settings: { ...ApplyFillProfile.DEFAULT_SETTINGS, ...(settings || {}) },
  };
}

function fillNow() {
  return loadState().then(async ({ profile, settings }) => {
    const results = await ApplyFill.fill(document, profile, settings);
    const platform = ApplyFillMatcher.detectPlatform(location.href);
    return { results, platform, href: location.href, title: document.title };
  });
}

async function ensureStyles(shadow) {
  if (shadow.querySelector("style[data-applyfill-css]")) return;
  const css = await fetch(chrome.runtime.getURL("src/content.css")).then((res) => res.text());
  const style = document.createElement("style");
  style.dataset.applyfillCss = "1";
  style.textContent = css;
  shadow.appendChild(style);
}

function hostEl() {
  let host = document.getElementById(HOST_ID);
  if (!host) {
    host = document.createElement("div");
    host.id = HOST_ID;
    host.style.all = "initial";
    host.style.position = "fixed";
    host.style.zIndex = "2147483646";
    host.style.left = "auto";
    host.style.right = "14px";
    host.style.top = "16px";
    host.style.bottom = "auto";
    host.style.pointerEvents = "none";
    document.documentElement.appendChild(host);
    host.attachShadow({ mode: "open" });
  }
  applyFabPosition(host);
  return host;
}

function applyFabPosition(host) {
  const width = 44;
  const maxLeft = Math.max(8, window.innerWidth - width - 8);
  const maxTop = Math.max(8, window.innerHeight - width - 8);
  let left = Number(fabSpot?.left);
  let top = Number(fabSpot?.top);
  if (!Number.isFinite(left)) left = maxLeft;
  if (!Number.isFinite(top)) top = 16;
  left = Math.min(Math.max(8, left), maxLeft);
  top = Math.min(Math.max(8, top), maxTop);
  host.style.left = `${Math.round(left)}px`;
  host.style.top = `${Math.round(top)}px`;
  host.style.right = "auto";
  host.style.bottom = "auto";
  const shell = host.shadowRoot?.querySelector(".af-shell");
  shell?.classList.toggle("flip", left < 300);
}

function robotButton(mood) {
  const fab = document.createElement("button");
  fab.className = "af-fab";
  fab.type = "button";
  fab.title = "ApplyFill. Drag to move.";
  fab.innerHTML = faceMarkup(mood);
  return fab;
}

function toggleRobotMenu(shell) {
  const existing = shell.querySelector(".af-menu");
  if (existing) {
    existing.remove();
    return;
  }
  const menu = document.createElement("div");
  menu.className = "af-menu";
  const fill = document.createElement("button");
  fill.type = "button";
  fill.textContent = "Fill this page";
  fill.addEventListener("click", async (event) => {
    event.stopPropagation();
    menu.remove();
    const next = await fillNow();
    if (!reviewOpen) {
      await renderHud(next);
      flashFields(next.results);
    }
  });
  const sheet = document.createElement("button");
  sheet.type = "button";
  sheet.textContent = "Spreadsheet";
  sheet.addEventListener("click", (event) => {
    event.stopPropagation();
    chrome.runtime.sendMessage({ type: "OPEN_TRACKER" });
  });
  menu.append(fill, sheet);
  shell.append(menu);
}

function bindRobot(fab, shell) {
  let pointerId = null;
  let startX = 0;
  let startY = 0;
  let originLeft = 0;
  let originTop = 0;
  let dragged = false;

  fab.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    const host = hostEl();
    const rect = host.getBoundingClientRect();
    pointerId = event.pointerId;
    startX = event.clientX;
    startY = event.clientY;
    originLeft = rect.left;
    originTop = rect.top;
    dragged = false;
    fab.setPointerCapture(pointerId);
  });
  fab.addEventListener("pointermove", (event) => {
    if (pointerId == null || event.pointerId !== pointerId) return;
    const dx = event.clientX - startX;
    const dy = event.clientY - startY;
    if (Math.hypot(dx, dy) > 5) dragged = true;
    if (!dragged) return;
    const host = hostEl();
    const left = Math.min(Math.max(8, originLeft + dx), window.innerWidth - 52);
    const top = Math.min(Math.max(8, originTop + dy), window.innerHeight - 52);
    fabSpot = { left, top };
    applyFabPosition(host);
  });
  fab.addEventListener("pointerup", (event) => {
    if (pointerId == null || event.pointerId !== pointerId) return;
    pointerId = null;
    if (dragged) {
      const rect = hostEl().getBoundingClientRect();
      fabSpot = { left: rect.left, top: rect.top };
      chrome.storage.local.set({ fabPosition: fabSpot });
      return;
    }
    toggleRobotMenu(shell);
  });
}

async function renderHud(payload) {
  if (!isTop() || reviewOpen) return;
  const host = hostEl();
  const shadow = host.shadowRoot;
  host.style.pointerEvents = "auto";
  shadow.innerHTML = "";
  await ensureStyles(shadow);

  const { results = [], platform } = payload;
  const unique = [];
  const seen = new Set();
  for (const item of results) {
    if (seen.has(item.key)) continue;
    seen.add(item.key);
    unique.push(item);
  }
  const grouped = new Map();
  for (const item of unique) {
    const key = item.section || "Application";
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(item);
  }

  const mood = unique.length ? "happy" : "idle";
  const status = unique.length
    ? `Filled ${unique.length} field${unique.length === 1 ? "" : "s"}`
    : "No empty fields matched";

  const wrap = document.createElement("div");
  wrap.className = `af-shell ${unique.length ? "is-open" : "is-empty"}`;
  wrap.innerHTML = `
    <button class="af-fab" type="button" title="ApplyFill">
      <span class="af-face ${mood}" aria-hidden="true">
        <span class="af-antenna"></span>
        <span class="af-eye left"></span>
        <span class="af-eye right"></span>
        <span class="af-mouth"></span>
      </span>
    </button>
    <aside class="af-card" role="status">
      <header class="af-head">
        <div>
          <p class="af-kicker">${platform?.label || "ApplyFill"}</p>
          <h2>${status}</h2>
        </div>
        <button class="af-close" type="button" aria-label="Hide panel">×</button>
      </header>
      <div class="af-log">
        ${unique.length ? [...grouped.entries()].map(([section, items]) => `
          <section>
            <h3>${escapeHtml(section)}</h3>
            ${items.map((item) => `
              <div class="af-row">
                <span class="af-label">${escapeHtml(item.label)}</span>
                <span class="af-value">${escapeHtml(item.value)}</span>
              </div>
            `).join("")}
          </section>
        `).join("") : `<p class="af-empty">Save your profile in the extension, then press Fill. Resume uploads still need a manual click.</p>`}
      </div>
    </aside>
  `;
  shadow.appendChild(wrap);

  bindRobot(wrap.querySelector(".af-fab"), wrap);
  applyFabPosition(host);
  wrap.querySelector(".af-close").addEventListener("click", (event) => {
    event.stopPropagation();
    wrap.classList.add("is-min");
  });

  if (unique.length) {
    wrap.classList.remove("is-min");
    flashFields(unique);
    setTimeout(() => wrap.classList.add("is-min"), 3500);
  } else {
    wrap.classList.add("is-min");
  }
}

function flashFields() {
  if (!document.getElementById("applyfill-page-style")) {
    const style = document.createElement("style");
    style.id = "applyfill-page-style";
    style.textContent = "[data-applyfill]{outline:2px solid #e8a054 !important;outline-offset:2px;}";
    document.documentElement.appendChild(style);
  }
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function maybeShowFab() {
  if (!isTop()) return;
  const { settings } = await loadState();
  const platform = ApplyFillMatcher.detectPlatform(location.href);
  if (!settings.showFab) return;
  if (platform.id === "generic" && !document.querySelector("form")) return;
  renderHud({ results: [], platform });
}

function faceMarkup(mood) {
  return `
    <span class="af-face ${mood}" aria-hidden="true">
      <span class="af-antenna"></span>
      <span class="af-eye left"></span>
      <span class="af-eye right"></span>
      <span class="af-mouth"></span>
    </span>`;
}

function paintLinkPreview(anchor, value) {
  const href = ApplyFillApplications.canonicalUrl(value);
  anchor.hidden = !href;
  anchor.textContent = href || "";
  if (href) anchor.href = href;
  else anchor.removeAttribute("href");
}

function reviewField(draft, key, label, type) {
  const wrap = document.createElement("label");
  wrap.className = "af-field";
  const caption = document.createElement("span");
  caption.textContent = label;
  const input = document.createElement("input");
  input.type = type === "date" ? "date" : "text";
  input.value = draft[key] || "";
  input.autocomplete = "off";
  input.spellcheck = key === "notes" || key === "title";
  input.addEventListener("input", () => {
    draft[key] = input.value;
    if (key === "url") paintLinkPreview(wrap.querySelector(".af-preview"), input.value);
  });
  wrap.append(caption, input);
  if (key === "url") {
    const preview = document.createElement("a");
    preview.className = "af-preview";
    preview.target = "_blank";
    preview.rel = "noopener noreferrer";
    wrap.append(preview);
    paintLinkPreview(preview, input.value);
  }
  return wrap;
}

function reviewStatus(draft) {
  const wrap = document.createElement("label");
  wrap.className = "af-field";
  const caption = document.createElement("span");
  caption.textContent = "Status";
  const select = document.createElement("select");
  select.className = "af-status";
  for (const item of ApplyFillApplications.STATUSES) {
    const option = document.createElement("option");
    option.value = item.id;
    option.textContent = item.label;
    select.append(option);
  }
  select.value = draft.status || "applied";
  select.dataset.status = select.value;
  select.addEventListener("change", () => {
    const previous = draft.status;
    draft.status = select.value;
    select.dataset.status = select.value;
    if (select.value === "accepted" && previous !== "accepted") ApplyFillConfetti.burst(document);
  });
  wrap.append(caption, select);
  return wrap;
}

function showScanSaved(body, draft) {
  reviewOpen = false;
  body.replaceChildren();
  const message = document.createElement("p");
  message.className = "af-empty";
  const name = String(draft.title || draft.company || "This internship").trim();
  message.textContent = `Saved “${name}”. It is on your tracker.`;
  const open = document.createElement("button");
  open.className = "af-save";
  open.type = "button";
  open.textContent = "Open tracker";
  open.addEventListener("click", () => chrome.runtime.sendMessage({ type: "OPEN_TRACKER" }));
  const done = document.createElement("button");
  done.className = "af-cancel";
  done.type = "button";
  done.textContent = "Close";
  done.addEventListener("click", () => dismissReview());
  const actions = document.createElement("div");
  actions.className = "af-actions";
  actions.append(open, done);
  body.append(message, actions);
}

async function renderScanReview(draft, updating) {
  const host = hostEl();
  const shadow = host.shadowRoot;
  host.style.pointerEvents = "auto";
  shadow.replaceChildren();
  await ensureStyles(shadow);

  const wrap = document.createElement("div");
  wrap.className = "af-shell is-open";
  const fab = robotButton("idle");

  const card = document.createElement("aside");
  card.className = "af-card af-review";
  card.setAttribute("role", "dialog");
  card.setAttribute("aria-label", "Check this internship before saving");

  const head = document.createElement("header");
  head.className = "af-head";
  const titles = document.createElement("div");
  const kicker = document.createElement("p");
  kicker.className = "af-kicker";
  kicker.textContent = updating ? "Already in tracker" : "New internship";
  const heading = document.createElement("h2");
  heading.textContent = "Check this posting";
  titles.append(kicker, heading);
  const close = document.createElement("button");
  close.className = "af-close";
  close.type = "button";
  close.setAttribute("aria-label", "Hide panel");
  close.textContent = "×";
  close.addEventListener("click", (event) => {
    event.stopPropagation();
    dismissReview();
  });
  head.append(titles, close);

  const body = document.createElement("div");
  body.className = "af-log";
  const hint = document.createElement("p");
  hint.className = "af-empty";
  hint.textContent = updating
    ? "This page is already tracked. Nothing changes until you agree to update it."
    : "Nothing is saved until you agree. Fix anything the scan got wrong.";

  const form = document.createElement("form");
  form.className = "af-form";
  form.addEventListener("submit", (event) => event.preventDefault());
  const fields = [
    ["title", "Position", "text"],
    ["company", "Company", "text"],
    ["location", "Location", "text"],
    ["date", "Date", "date"],
    ["posted", "Posted", "date"],
    ["term", "Term", "text"],
    ["url", "Link", "text"],
    ["notes", "Notes", "text"],
  ];
  for (const [key, label, type] of fields) form.append(reviewField(draft, key, label, type));
  form.append(reviewStatus(draft));

  const error = document.createElement("p");
  error.className = "af-error";
  error.hidden = true;
  const actions = document.createElement("div");
  actions.className = "af-actions";
  const save = document.createElement("button");
  save.className = "af-save";
  save.type = "button";
  save.textContent = updating ? "Update tracker" : "Save to tracker";
  const cancel = document.createElement("button");
  cancel.className = "af-cancel";
  cancel.type = "button";
  cancel.textContent = "Don't save";
  cancel.addEventListener("click", () => dismissReview());
  save.addEventListener("click", async () => {
    if (!String(draft.title || "").trim() && !String(draft.company || "").trim()) {
      error.hidden = false;
      error.textContent = "Add a position name or company before saving.";
      return;
    }
    save.disabled = true;
    error.hidden = true;
    try {
      const stored = await chrome.storage.local.get("applications");
      const next = ApplyFillApplications.upsert(stored.applications, draft);
      await chrome.storage.local.set({ applications: next });
      showScanSaved(body, draft);
    } catch (err) {
      save.disabled = false;
      error.hidden = false;
      error.textContent = err?.message || "Could not save on this device.";
    }
  });
  actions.append(save, cancel);
  form.append(error, actions);
  body.append(hint, form);
  card.append(head, body);
  wrap.append(fab, card);
  bindRobot(fab, wrap);
  shadow.append(wrap);
  applyFabPosition(host);
}

async function dismissReview() {
  reviewOpen = false;
  const { settings } = await loadState();
  if (settings.showFab === false) {
    document.getElementById(HOST_ID)?.remove();
    return;
  }
  await renderHud({ results: [], platform: ApplyFillMatcher.detectPlatform(location.href) });
}

async function openScanReview() {
  if (!isTop()) return { ok: false };
  if (reviewOpen) return { ok: true, already: true };
  if (!globalThis.ApplyFillScan || !globalThis.ApplyFillApplications) {
    return { ok: false, error: "Reload this page, then scan again." };
  }
  reviewOpen = true;
  try {
    const scanned = ApplyFillScan.scanPosting(document, location.href);
    const stored = await chrome.storage.local.get("applications");
    const existing = ApplyFillApplications.findExisting(stored.applications, scanned);
    const draft = ApplyFillApplications.mergeReview(existing, scanned);
    await renderScanReview(draft, Boolean(existing));
    return { ok: true, title: draft.title, company: draft.company };
  } catch (error) {
    reviewOpen = false;
    return { ok: false, error: error?.message || "Could not scan this page." };
  }
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "PING") {
    sendResponse({
      ok: true,
      url: location.href,
      title: document.title,
      platform: ApplyFillMatcher.detectPlatform(location.href),
      top: isTop(),
    });
    return;
  }
  if (message.type === "FILL") {
    fillNow().then((payload) => {
      sendResponse(payload);
    });
    return true;
  }
  if (message.type === "SHOW_HUD" && isTop()) {
    renderHud(message.payload);
    return;
  }
  if (message.type === "SCAN") {
    openScanReview().then(sendResponse);
    return true;
  }
});

document.addEventListener("keydown", (event) => {
  if (!event.altKey || !event.shiftKey || event.ctrlKey || event.metaKey) return;
  if (event.code !== "KeyF" && event.code !== "KeyS") return;
  event.preventDefault();
  event.stopPropagation();
  const now = Date.now();
  if (now - shortcutAt < 500) return;
  shortcutAt = now;
  chrome.runtime.sendMessage({ type: event.code === "KeyF" ? "FILL_ACTIVE_TAB" : "SCAN_ACTIVE_TAB" });
}, true);

chrome.storage.local.get("fabPosition", ({ fabPosition }) => {
  fabSpot = fabPosition || null;
  const host = document.getElementById(HOST_ID);
  if (host) applyFabPosition(host);
});

if (isTop()) {
  maybeShowFab();
  loadState().then(({ profile, settings }) => {
    const platform = ApplyFillMatcher.detectPlatform(location.href);
    const ready = profile.firstName && profile.email;
    if (settings.autoFillAts && platform.id !== "generic" && ready) {
      ApplyFill.fill(document, profile, settings).then((results) => {
        renderHud({ results, platform });
      });
    }
  });
}
