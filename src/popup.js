const fillBtn = document.getElementById("fill");
const scanBtn = document.getElementById("scan");
const status = document.getElementById("status");
const complete = document.getElementById("complete");
const completeBar = document.getElementById("completeBar");
const log = document.getElementById("log");

async function refreshCompleteness() {
  const { profile } = await chrome.storage.local.get("profile");
  const fields = ["firstName", "lastName", "email", "phone", "school", "major", "linkedin", "github", "workAuth", "graduationDate"];
  const filled = fields.filter((key) => String(profile?.[key] || "").trim()).length;
  complete.textContent = `${filled} / ${fields.length} core`;
  if (completeBar) completeBar.style.width = `${Math.round((filled / fields.length) * 100)}%`;
}

fillBtn.addEventListener("click", async () => {
  fillBtn.disabled = true;
  status.textContent = "Looking for blanks on this page…";
  const response = await chrome.runtime.sendMessage({ type: "FILL_ACTIVE_TAB" });
  fillBtn.disabled = false;

  if (response?.error) {
    status.textContent = response.error;
    return;
  }

  const results = response?.results || [];
  const where = response?.platform?.label || "this page";
  status.textContent = results.length
    ? `Inserted ${results.length} answer${results.length === 1 ? "" : "s"} on ${where}.`
    : `No matching empty fields on ${where}. Add more profile details or click into the application form.`;

  log.hidden = results.length === 0;
  log.innerHTML = results.map((item) => `
    <li>
      <span><small>${escapeHtml(item.section)}</small><br>${escapeHtml(item.label)}</span>
      <strong>${escapeHtml(item.value)}</strong>
    </li>
  `).join("");
});

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

scanBtn.addEventListener("click", async () => {
  scanBtn.disabled = true;
  status.textContent = "Reading this posting…";
  const response = await chrome.runtime.sendMessage({ type: "SCAN_ACTIVE_TAB" });
  scanBtn.disabled = false;
  if (!response || response.error) {
    status.textContent = response?.error || "Could not scan this page.";
    return;
  }
  const name = response.title || response.company || "this posting";
  status.textContent = `Check “${name}” on the page, then agree to save it in the tracker.`;
});

refreshCompleteness();
