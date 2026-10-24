# ApplyFill

A Chrome / Edge extension that types **your** saved internship answers into application blanks, then shows a small bot listing what it filled.

It does **not** submit the form. It does **not** upload a resume. Each person installs their own copy and saves their own profile on their own laptop.

The same profile fills common intern questions on Greenhouse, Handshake, Lever, Workday, Ashby, LinkedIn, Indeed, tesla.com, and ordinary HTML forms.

## Privacy (read this first)

- Your name, email, phone, school, and tracked internships are stored only in **your browser** (`chrome.storage.local`). They are never sent to a server.
- This GitHub repo does **not** contain anyone’s real profile. Placeholders and practice forms use fake example data.
- **Do not** paste your real resume, passwords, or Social Security number into the profile.
- **Do not** copy a friend’s filled-in Chrome profile. Clone this repo, load the extension yourself, then type **your** answers in **Edit profile**.
- Sharing the GitHub link is fine. Sharing a screenshot of your filled profile is not.

## Install on your laptop

You need Chrome or Edge. This is an unpacked extension (not in the Chrome Web Store).

### 1. Get the code

**Option A — GitHub in the browser**

1. Open this repository on GitHub.
2. Click the green **Code** button → **Download ZIP**.
3. Unzip it somewhere easy to find, for example `Documents\applyfill`.

**Option B — git**

```bash
git clone https://github.com/yovanii67/applyfill.git
```

Use the folder that contains `manifest.json`.

### 2. Load it in Chrome or Edge

1. Open `chrome://extensions` (Chrome) or `edge://extensions` (Edge).
2. Turn on **Developer mode** (top right).
3. Click **Load unpacked**.
4. Select the `applyfill` folder (the one with `manifest.json`).
5. Pin ApplyFill: puzzle-piece icon in the toolbar → pin the robot.

If Chrome asks to **Allow** debugger access, click Allow. Some radios and checkboxes need a real click. You may see a brief “debugging this browser” bar while it fills. That is expected.

After you pull new code, click **Reload** on the ApplyFill card in `chrome://extensions`.

### 3. Fill YOUR profile (required)

The extension ships empty. It will not know your name until you save it.

1. Click the ApplyFill icon in the toolbar.
2. Click **Edit profile**.
3. Fill the sections that apply to you:
   - **Identity / Contact / Education** — name, email, phone, school, major, GPA, graduation
   - **Internship basics** — student status, 18+, term, full-time, hours, phone type, other openings, previous employment
   - **Links** — LinkedIn, GitHub, portfolio
   - **Work authorization** — authorized to work, sponsorship, start date
   - **EEO (optional)** — acknowledgement and optional self-identification
   - **Terms & agreements** — set to Yes only after you have read those documents
4. Click **Save profile**. Answers stay on this computer only.

Grey hint text is only an example. Type your real answers.

### 4. Use it on an application

1. Open the intern / job application in Chrome or Edge.
2. Click the ApplyFill icon → **Fill this page**, or click the robot on the page, or press **Alt + Shift + F**.
3. Check the list in the corner: section → field → value.
4. Finish anything it skipped (resume upload, essays, odd widgets).
5. **You** click Submit. ApplyFill never sends the application.

Multi-step forms: run Fill again on each new page.

## Track internships

The tracker is a separate page from profile fill. Positions stay on this computer only.

1. Open the internship posting.
2. Press **Alt + Shift + D**, or click **Scan this posting** in the popup.
3. The bot reads the position name, company, location, dates, term, and the page link.
4. Check the card. Change anything that looks wrong, and pick a status if you want.
5. Click **Save to tracker**. Nothing is stored if you click **Don't save**.
6. Open **Tracker** from the popup. Each internship is a row. The page link sits under the position name. Edit any cell, add a row, or remove one.

Status menu:

- **Applied** — no color. This is the default when you save.
- **Rejected** — red.
- **Interview** — green.
- **Accepted** — confetti. The menu stays uncolored after the burst.

If Chrome did not reserve the shortcut, open `chrome://extensions/shortcuts` and set **Scan this posting into the internship tracker** to Alt + Shift + D.

A sample posting is `demo/posting.html`. The practice application form is still `demo/application.html`.

## Practice first (optional)

From the extension popup, open **Practice form** — generic intern blanks (Greenhouse-style), including other-openings, previous employment, SMS, EEO, and terms questions. **Tracker** opens the internship spreadsheet. The sample posting is linked from an empty tracker.

Practice pages use fake sample data unless you already saved a profile.

## What it fills

**Most intern apps:** first/last/legal name, email, phone, address, school, degree, major, GPA, class year, graduation, LinkedIn/GitHub, work authorization, sponsorship, start date, current student, 18+, intern term, full-time, hours, relocate, how you heard, other openings, previous employment, intern/contractor, SMS consent, optional EEO dropdowns, simple “I agree” boxes.

## What it will not do

- Submit the application
- Attach a resume or transcript
- Invent cover letters or “why this company” essays
- Fill a calendar date-picker (type those by hand if they appear)
- Replace your judgment — always read terms, EEO, and required questions before you submit
- Upload your profile anywhere — storage is `chrome.storage.local` only

## Settings

In **Edit profile**, at the bottom:

- **Skip fields that already have text** — leave on so it does not overwrite what you typed
- **Show the bot face** — robot on application pages
- **Auto-fill known job sites** — leave off unless you want Greenhouse/Lever/Workday pages to fill as they load. Review before you submit.

## For friends

1. Send them this GitHub link. Do not send your Chrome user folder or a screenshot of **Edit profile**.
2. They follow **Install on your laptop** and **Fill YOUR profile**.
3. Each laptop has its own extension and its own saved answers.

If they already loaded an older copy, they should **Reload** the unpacked extension after pulling updates.

## Limits

Custom Workday, LinkedIn, and similar widgets do not always behave like a normal text box. Fill what is visible, then finish the rest by hand.

## License

MIT. See [LICENSE](LICENSE).
