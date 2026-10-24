const form = document.getElementById("profile");
const toast = document.getElementById("toast");
const complete = document.getElementById("complete");
const completeBar = document.getElementById("completeBar");

const grouped = new Map();
for (const field of ApplyFillProfile.FIELDS) {
  if (!grouped.has(field.section)) grouped.set(field.section, []);
  grouped.get(field.section).push(field);
}

for (const [section, fields] of grouped) {
  const card = document.createElement("section");
  card.className = "card";
  const heading = document.createElement("h2");
  heading.textContent = ApplyFillProfile.SECTIONS[section] || section;
  card.appendChild(heading);
  const note = ApplyFillProfile.SECTION_NOTES?.[section];
  if (note) {
    const hint = document.createElement("p");
    hint.className = "section-note";
    hint.textContent = note;
    card.appendChild(hint);
  }
  const grid = document.createElement("div");
  grid.className = "grid";
  for (const field of fields) {
    const label = document.createElement("label");
    label.className = field.type === "textarea" ? "field wide" : "field";
    label.textContent = field.label;
    const input = field.type === "textarea" ? document.createElement("textarea") : document.createElement("input");
    input.name = field.key;
    input.placeholder = field.placeholder || "";
    if (field.type && field.type !== "textarea") input.type = field.type;
    if (field.type === "textarea") input.rows = 4;
    label.appendChild(input);
    grid.appendChild(label);
  }
  card.appendChild(grid);
  form.appendChild(card);
}

function renderCompleteness(profile) {
  const { filled, total } = ApplyFillProfile.completeness(profile || {});
  if (complete) complete.textContent = `${filled} / ${total}`;
  if (completeBar) completeBar.style.width = total ? `${Math.round((filled / total) * 100)}%` : "0%";
}

async function load() {
  const { profile, settings } = await chrome.storage.local.get(["profile", "settings"]);
  const merged = ApplyFillProfile.derive({ ...ApplyFillProfile.DEFAULTS, ...(profile || {}) });
  for (const input of form.elements) {
    if (input.name) input.value = merged[input.name] || "";
  }
  const next = { ...ApplyFillProfile.DEFAULT_SETTINGS, ...(settings || {}) };
  document.getElementById("skipFilled").checked = next.skipFilled !== false;
  document.getElementById("showFab").checked = next.showFab !== false;
  document.getElementById("autoFillAts").checked = Boolean(next.autoFillAts);
  renderCompleteness(merged);
}

document.getElementById("save").addEventListener("click", async () => {
  const profile = ApplyFillProfile.derive(
    Object.fromEntries([...form.elements].filter((input) => input.name).map((input) => [input.name, input.value.trim()])),
  );
  const settings = {
    skipFilled: document.getElementById("skipFilled").checked,
    showFab: document.getElementById("showFab").checked,
    autoFillAts: document.getElementById("autoFillAts").checked,
  };
  await chrome.storage.local.set({ profile, settings });
  for (const input of form.elements) {
    if (input.name) input.value = profile[input.name] || "";
  }
  renderCompleteness(profile);
  toast.hidden = false;
  setTimeout(() => { toast.hidden = true; }, 1600);
});

load();
