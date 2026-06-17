# Char Dham Ropeway — Service-Provider Survey Dashboard

A client-side survey + dashboard for the Char Dham Ropeway livelihood assessment,
built in the same plain **HTML / CSS / JavaScript** style as the reference
[CharDhamSurvey](https://github.com/anujn08/CharDhamSurvey) repo — no build step, no server.

It implements the **grouped & routed questionnaire** in
`CharDham_Survey_Optimized_Routed.md`, including the master Path A/B/C routing and
all conditional gates.

## Files

| File | Purpose |
|---|---|
| `index.html` | The multi-step survey form |
| `survey-schema.js` | The questionnaire as data: 16 modules, routing + `showIf` gates |
| `script.js` | Form engine — rendering, conditional logic, validation, localStorage |
| `dashboard.html` / `dashboard.js` | Response dashboard — stats, charts, CSV/Excel export |
| `style.css` | Shared styles |

## Running

It's fully static. Open `index.html` directly in a browser, **or** serve the folder:

```powershell
# Python
python -m http.server 8000
# then open http://localhost:8000
```

## How the routing / conditional logic works

Every question carries an optional `showIf(answers)` predicate in `survey-schema.js`.
The form re-renders on each answer change, so dependent questions appear/disappear live.

- **Master routing (Q0.5).** Respondent category sets **Path A** (mobile providers:
  pony/mule, porter, palki/dandi), **Path B** (fixed: shop, dhaba, hotel) or **Path C**
  (guide, priest, driver, other). Module 5 (Work Economics) shows only the matching
  sub-block (5A / 5B / 5C), and Q2.6 (animal count) appears only for Path A.
- **Consent gate (Q0.6).** "No" collapses the survey — all later modules hide and the
  record is stored as a non-consent contact.
- **Source-gated income (Module 4).** Q4.1 (tick-all sources) reveals only the income
  amounts for sources actually ticked; Q4.4 (Yatra income) is always asked.
- **Other gates.** Assets (6.1), debt (7.1), savings (7.9), shocks (8.1), awareness (9.1),
  income-decrease detail (10.2→10.3), reskilling (11.6→11.7), migration (11.8→11.9),
  land (12.1) — each reveals its follow-ups only when relevant.
- **Piping.** Animal count from Q2.6 is reused as Q6.3 (number of animals).
- **"Don't know / Refused"** is appended automatically to closed single-choice questions
  (except routing/Yes-No gates), per the questionnaire spec.

## Data

- Every submission is saved to browser **localStorage** (`charDhamRopewaySurvey.responses`)
  as a backup.
- If `config.js` has a `scriptUrl`, each submission is **also POSTed to a Google Sheet**
  via Google Apps Script — that sheet becomes the central, shared record. See
  [DEPLOY.md](DEPLOY.md) for the one-time setup, and `google-apps-script.gs` for the
  backend code. Leave `scriptUrl` empty to stay local-only.
- The dashboard renders summary charts (Chart.js) and a preview table, and exports the
  **full local** response set to **CSV** or **Excel** (SheetJS). When the Sheet backend is
  on, the **Google Sheet** is the source of truth; the in-app dashboard only shows responses
  stored on the current device.

## Publishing / sharing

See [DEPLOY.md](DEPLOY.md) for a no-`git` walkthrough: deploy the Apps Script, paste the URL
into `config.js`, upload the files to GitHub via the web uploader, and enable GitHub Pages to
get a public link you can share.

## Notes on the questionnaire

The questionnaire follows the grouped/routed spec as written, including the Tier-2 modules
(health/literacy/language 1.11–1.13 and land Module 12) and the light Path-C economics block.
Options not enumerated in the source MD (e.g. gender, education bands) use standard categories
and can be edited in `survey-schema.js`.
