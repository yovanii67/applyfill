## Cursor Cloud specific instructions

ApplyFill is an unpacked Manifest V3 extension. There is no install step and no build. The folder that contains `manifest.json` is the extension root.

- Branded Google Chrome ignores `--load-extension`. Use Chromium or Chrome for Testing, with `--disable-extensions-except` and `--load-extension` pointed at this folder.
- Content scripts run on `http` and `https` pages only. Serve the repo (`python3 -m http.server`) before opening `demo/application.html` (fill practice) or `demo/posting.html` (tracker practice). `file://` will not inject the bot.
- Alt+Shift+F fills the open application from the saved profile. Alt+Shift+S scans the open posting and asks before saving it. The popup buttons do the same things. The on-page robot can be dragged; a click opens Fill this page or Spreadsheet.
- Profile answers and tracked internships stay in `chrome.storage.local` on that browser profile. The tracker page is `src/tracker.html`.
- After code changes, reload the unpacked extension, then reload the open tab.
