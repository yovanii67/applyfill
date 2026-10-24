const HOST_ID = "applyfill-host";

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
    host.style.right = "14px";
    host.style.top = "16px";
    host.style.bottom = "auto";
    host.style.pointerEvents = "none";
    document.documentElement.appendChild(host);
    host.attachShadow({ mode: "open" });
  }
  return host;
}

async function renderHud(payload) {
  if (!isTop()) return;
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

  wrap.querySelector(".af-fab").addEventListener("click", async () => {
    const next = await fillNow();
    await renderHud(next);
    flashFields(next.results);
  });
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
  }
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
