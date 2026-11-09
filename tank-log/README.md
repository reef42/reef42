# Tank Log

Bilingual (English / Hungarian) water parameter log for saltwater aquariums. Static HTML/CSS/JS, no build
step, no backend, no external libraries.

## Features

- **Fast entry**: one input per parameter; Enter jumps to the next one, Ctrl/Cmd+Enter saves. Shows the previous
  value, the change (colour-coded: green = in range, amber = out of range but moving towards it, red = out of range
  and moving away) and a small gauge against the target range.
- **Parameters**: temperature, salinity, pH, KH, Ca, Mg, NO₃, PO₄ by default; more from a list (NH₃, NO₂, K, I, Sr,
  Si, Fe, Cu, ORP) or fully custom ones. Each can be reordered, hidden or removed.
- **Test-kit timers** per parameter: presets every 30 s up to 5 min, then every minute up to 15 min, or a custom
  time. The last used time is remembered per parameter, so the next start is one tap. Several timers can run at once;
  they show in a strip under the navigation on every page, beep and vibrate when done.
- **Target ranges and templates** (mixed reef, SPS, LPS/soft, FOWLR, quarantine, or your own saved ones).
- **Charts** per parameter with the target band, out-of-range points, notes and hover/tap details.
- **History** table (edit / delete) and **notes** per measurement (water change, dosing, new livestock…).
- **Several tanks**.
- **Guide** tab: a card per parameter with what it is, why it matters, ideal and tolerable range, safe rate of
  change, how to raise and lower it, where it comes from and a testing tip, next to your own target and last reading.
  The ⓘ button next to a parameter on the Measure tab opens its card. Content lives in `data/guide.json` (EN/HU).
- **Sharing**: copy or share a text summary of the latest values, or a read-only link. The link carries the data
  itself in the URL fragment (compressed), so nothing is uploaded; the recipient can save it as their own tank.
- **Backup**: JSON export and import (import replaces all data), CSV export per tank.
- **Aquarium Log import**: select the measurements CSV (`parameter,value,createdAt,note`) and the notes CSV
  (`date,description`) of one tank together, into an existing or a new tank. Readings within 3 hours become one
  entry, notes are attached to that day’s entry (or become a note-only entry), and values already in the tank are
  skipped, so importing the same files again adds nothing.

## Storage and other GitHub Pages limits

| Limit | What it means | How the tool handles it |
| --- | --- | --- |
| No server | Nothing can be stored centrally or synced between devices | Data lives in `localStorage`; JSON export/import moves it between devices |
| Browser storage can be cleared | Clearing site data, private mode, or Safari (iOS/macOS) deleting storage of sites not opened for 7 days | Asks the browser for persistent storage, reminds the user to back up when there is no backup or the last one is over 30 days old |
| Shared origin | Every repo of the owner on `*.github.io` shares one `localStorage` | Keys are prefixed with `reef42-tanklog-` |
| Background tabs and locked phones | Timers in JS are throttled or paused | Timers are based on end timestamps, the beep is pre-scheduled with Web Audio, the screen is kept awake (Wake Lock API) while a timer runs, and running timers survive a reload |
| iOS | Web Audio is muted by the silent switch; vibration is not supported | The timer also flashes on screen and in the tab title |
| Share links | Long URLs can be cut by some chat apps | Data is compressed (`deflate-raw`); the link period can be limited (30 days … all) |

## Data format

`localStorage['reef42-tanklog-v1']` (and the JSON backup) contains:

```json
{
  "v": 1,
  "tanks": [{ "id": "…", "name": "My reef", "volume": 300,
              "params": [{ "id": "…", "key": "kh", "name": "", "unit": "dKH", "min": 7, "max": 9, "timer": 180, "hidden": false }] }],
  "sessions": [{ "id": "…", "tankId": "…", "t": 1762690000000, "v": { "<param id>": 8.2 }, "note": "" }],
  "templates": [{ "id": "…", "name": "My SPS", "p": [{ "key": "kh", "name": "", "unit": "dKH", "min": 7, "max": 8.5 }] }],
  "active": "<tank id>",
  "lastBackup": null
}
```

`key` refers to a built-in parameter (name translated automatically); custom parameters have `key: null` and a `name`.

## Running locally

See the [repository README](../README.md). Serve the repository root and open `/tank-log/`.
