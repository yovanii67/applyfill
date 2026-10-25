const rowsEl = document.getElementById("rows");
const countEl = document.getElementById("count");
const toast = document.getElementById("toast");
const live = document.getElementById("live");
const addBtn = document.getElementById("add");
const exportBtn = document.getElementById("exportPdf");

const COLUMN_KEYS = ["position", "company", "location", "date", "posted", "term", "notes", "status", "remove"];
const DEFAULT_WIDTHS = {
  position: 260,
  company: 150,
  location: 150,
  date: 150,
  posted: 150,
  term: 130,
  notes: 210,
  status: 150,
  remove: 96,
};

let apps = [];
let widths = { ...DEFAULT_WIDTHS };
let saveTimer = 0;
let suppress = false;
let toastTimer = 0;

function applyWidths() {
  const table = document.querySelector(".sheet");
  if (!table) return;
  const heads = [...table.querySelectorAll("thead th")];
  let total = 0;
  heads.forEach((th, index) => {
    const key = COLUMN_KEYS[index];
    const min = key === "status" ? 124 : 80;
    const width = Math.max(min, Number(widths[key]) || DEFAULT_WIDTHS[key]);
    widths[key] = width;
    th.style.width = `${width}px`;
    total += width;
  });
  table.style.width = `${total}px`;
}

function installResizeHandles() {
  const heads = [...document.querySelectorAll(".sheet thead th")];
  heads.forEach((th, index) => {
    const key = COLUMN_KEYS[index];
    if (!key || th.querySelector(".col-resize")) return;
    const handle = document.createElement("span");
    handle.className = "col-resize";
    handle.title = "Drag to resize this column";
    handle.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const startX = event.clientX;
      const start = widths[key];
      const min = key === "status" ? 124 : 80;
      function move(ev) {
        widths[key] = Math.max(min, Math.round(start + ev.clientX - startX));
        applyWidths();
      }
      function up() {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        if (globalThis.chrome?.storage?.local) chrome.storage.local.set({ columnWidths: widths });
      }
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    });
    th.append(handle);
  });
  applyWidths();
}

function flashSaved(text) {
  if (!toast) return;
  toast.hidden = false;
  toast.textContent = text || "Saved on this device.";
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => { toast.hidden = true; }, 1600);
}

function scheduleSave() {
  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => persist(), 250);
}

async function persist() {
  suppress = true;
  try {
    await chrome.storage.local.set({ applications: apps });
    flashSaved();
  } finally {
    window.setTimeout(() => { suppress = false; }, 80);
  }
}

function printValue(text) {
  const span = document.createElement("span");
  span.className = "print-value";
  span.textContent = text || "";
  return span;
}

function statusLabel(id) {
  return ApplyFillApplications.STATUSES.find((item) => item.id === id)?.label || id || "";
}

function textCell(row, key, label, className) {
  const input = document.createElement("input");
  input.className = `cell ${className || ""}`.trim();
  input.type = key === "date" || key === "posted" ? "date" : "text";
  input.setAttribute("aria-label", label);
  input.value = row[key] || "";
  input.autocomplete = "off";
  input.addEventListener("input", () => {
    row[key] = input.value;
    scheduleSave();
  });
  return input;
}

function positionCell(row) {
  const cell = document.createElement("td");
  cell.className = "position";
  const title = textCell(row, "title", "Position name", "title");
  title.placeholder = "Position name";

  const linkRow = document.createElement("div");
  linkRow.className = "pos-links";
  const link = document.createElement("a");
  link.className = "pos-link";
  link.target = "_blank";
  link.rel = "noopener noreferrer";

  const url = textCell(row, "url", "Posting link", "url");
  url.placeholder = "https://";
  url.addEventListener("input", paint);
  url.addEventListener("blur", () => {
    const href = ApplyFillApplications.canonicalUrl(row.url);
    if (href && href !== row.url) {
      row.url = href;
      url.value = href;
      scheduleSave();
    }
    cell.classList.remove("url-editing");
    paint();
  });

  const edit = document.createElement("button");
  edit.type = "button";
  edit.className = "edit-link";
  edit.textContent = "Edit link";
  edit.addEventListener("click", () => {
    cell.classList.add("url-editing");
    paint();
    url.focus();
  });

  function paint() {
    const href = ApplyFillApplications.canonicalUrl(row.url);
    const editing = cell.classList.contains("url-editing");
    const showLink = Boolean(href) && !editing;
    linkRow.hidden = !showLink;
    url.hidden = showLink;
    if (href) {
      link.href = href;
      link.textContent = href;
      link.title = href;
    } else {
      link.removeAttribute("href");
      link.textContent = "";
      link.title = "";
    }
  }

  paint();
  linkRow.append(link, edit);
  const printed = printValue([row.title, row.url].filter(Boolean).join("\n"));
  cell.append(title, linkRow, url, printed);
  return cell;
}

function statusCell(row) {
  const td = document.createElement("td");
  const select = document.createElement("select");
  select.className = "status";
  select.setAttribute("aria-label", `Status for ${row.title || "this internship"}`);
  for (const item of ApplyFillApplications.STATUSES) {
    const option = document.createElement("option");
    option.value = item.id;
    option.textContent = item.label;
    select.append(option);
  }
  select.value = row.status;
  select.dataset.status = row.status;
  select.addEventListener("change", () => {
    const previous = row.status;
    row.status = select.value;
    select.dataset.status = select.value;
    if (row.status === "accepted" && previous !== "accepted") {
      const played = ApplyFillConfetti.burst(document);
      const name = row.title || "This internship";
      if (live) live.textContent = `${name} marked accepted.`;
      if (!played) flashSaved("Marked accepted.");
    }
    scheduleSave();
  });
  td.append(select, printValue(statusLabel(row.status)));
  return td;
}

function removeCell(row) {
  const td = document.createElement("td");
  const button = document.createElement("button");
  button.type = "button";
  button.className = "remove";
  button.textContent = "Delete";
  button.addEventListener("click", () => {
    if (button.dataset.armed !== "1") {
      button.dataset.armed = "1";
      button.textContent = "Remove?";
      window.setTimeout(() => {
        if (button.dataset.armed === "1") {
          button.dataset.armed = "";
          button.textContent = "Delete";
        }
      }, 2200);
      return;
    }
    apps = apps.filter((item) => item.id !== row.id);
    render();
    persist();
  });
  td.append(button);
  return td;
}

function render() {
  if (countEl) countEl.textContent = String(apps.length);
  if (exportBtn) exportBtn.disabled = !apps.length;
  rowsEl.replaceChildren();
  if (!apps.length) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 9;
    td.className = "empty";
    td.append("No internships yet. Open a posting and press Alt + Shift + S, or ");
    const sample = document.createElement("a");
    sample.href = "../demo/posting.html";
    sample.target = "_blank";
    sample.rel = "noopener noreferrer";
    sample.textContent = "try the sample posting";
    td.append(sample, ".");
    tr.append(td);
    rowsEl.append(tr);
    return;
  }

  for (const row of apps) {
    const tr = document.createElement("tr");
    tr.dataset.id = row.id;
    tr.append(positionCell(row));
    const company = document.createElement("td");
    company.append(textCell(row, "company", "Company"), printValue(row.company));
    const location = document.createElement("td");
    location.append(textCell(row, "location", "Location"), printValue(row.location));
    const date = document.createElement("td");
    date.append(textCell(row, "date", "Date", "date"), printValue(row.date));
    const posted = document.createElement("td");
    posted.append(textCell(row, "posted", "Posted date", "date"), printValue(row.posted));
    const term = document.createElement("td");
    term.append(textCell(row, "term", "Term"), printValue(row.term));
    const notes = document.createElement("td");
    notes.append(textCell(row, "notes", "Notes", "notes"), printValue(row.notes));
    tr.append(company, location, date, posted, term, notes, statusCell(row), removeCell(row));
    rowsEl.append(tr);
  }
}

function addRow() {
  const row = ApplyFillApplications.create({
    date: ApplyFillScan.todayISO(new Date()),
    status: "applied",
  });
  apps.unshift(row);
  render();
  document.querySelector("input.title")?.focus();
  persist();
}

async function load() {
  if (!globalThis.chrome?.storage?.local) {
    rowsEl.replaceChildren();
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 9;
    td.className = "empty";
    td.textContent = "Open this tracker from the ApplyFill popup so it can use this browser’s saved list.";
    tr.append(td);
    rowsEl.append(tr);
    if (addBtn) addBtn.disabled = true;
    if (exportBtn) exportBtn.disabled = true;
    return;
  }
  const stored = await chrome.storage.local.get(["applications", "columnWidths"]);
  apps = ApplyFillApplications.normalize(stored.applications);
  if (stored.columnWidths && typeof stored.columnWidths === "object") {
    widths = { ...DEFAULT_WIDTHS, ...stored.columnWidths };
  }
  installResizeHandles();
  render();
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local" || !changes.applications || suppress) return;
    if (document.activeElement?.closest?.(".sheet")) return;
    apps = ApplyFillApplications.normalize(changes.applications.newValue);
    render();
  });
}

function downloadPdf() {
  if (!apps.length) {
    flashSaved("Nothing to export.");
    return;
  }
  const previous = document.title;
  const day = new Date().toISOString().slice(0, 10);
  document.title = `ApplyFill-tracker-${day}`;
  document.body.classList.add("is-printing");
  const done = () => {
    document.title = previous;
    document.body.classList.remove("is-printing");
    window.removeEventListener("afterprint", done);
  };
  window.addEventListener("afterprint", done);
  window.print();
}

addBtn?.addEventListener("click", addRow);
exportBtn?.addEventListener("click", downloadPdf);
load();
