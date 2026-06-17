# Deploying & sharing the survey

Goal: a public link anyone can open to fill the survey, with every response landing
in **one Google Sheet you own**. No coding and no `git` install required.

Do the steps in order.

---

## Step 1 — Create the Google Sheet backend (collects responses)

1. Go to <https://sheets.google.com> and create a **new blank sheet**. Name it e.g.
   *Char Dham Ropeway Responses*.
2. In that sheet: **Extensions ▸ Apps Script**. A code editor opens.
3. Delete the sample `function myFunction() {}`.
4. Open `google-apps-script.gs` from this project, copy **everything**, and paste it in.
5. Click **Save** (💾).
6. Click **Deploy ▸ New deployment**.
   - Click the gear ⚙ next to "Select type" → choose **Web app**.
   - **Description:** anything. **Execute as:** *Me*. **Who has access:** **Anyone**.
   - Click **Deploy**. Approve the Google permission prompt (it's your own script).
7. Copy the **Web app URL** — it ends in `/exec`. Keep it handy.
8. (Optional check) Paste that URL in a browser; you should see
   *"Char Dham Ropeway Survey endpoint is live."*

> Responses will appear on the **Responses** tab of your sheet, one row per submission.
> Columns are created automatically.

---

## Step 2 — Put your URL into the survey

1. Open `config.js` in this project.
2. Paste your `/exec` URL between the quotes:
   ```js
   window.SURVEY_CONFIG = {
     scriptUrl: "https://script.google.com/macros/s/AKfycb..../exec",
   };
   ```
3. Save the file.

---

## Step 3 — Upload to GitHub (web uploader, no git needed)

1. Go to <https://github.com/new> and create a repository, e.g. `chardham-ropeway-survey`.
   Set it **Public**. Don't add a README (you already have one). Click **Create**.
2. On the empty repo page, click **uploading an existing file**
   (link under "…or push an existing repository").
3. Drag in **all these files** from the `d:\Chardham` folder:
   - `index.html`, `dashboard.html`
   - `config.js` *(with your URL now in it)*, `survey-schema.js`, `script.js`, `dashboard.js`
   - `style.css`
   - `sw.js` **(required for offline use — must be uploaded)**
   - `README.md`, `DEPLOY.md`, `google-apps-script.gs` *(reference only — harmless)*
   - You do **not** need to upload `seed-sample.html` (demo data) or
     `CharDham_Survey_Optimized_Routed.md`. Skip them for a clean public site.
4. Click **Commit changes**.

> Updating later: open a file on GitHub → pencil ✏ → edit → commit, or use
> **Add file ▸ Upload files** again.

---

## Step 4 — Turn on GitHub Pages (creates the public link)

1. In the repo: **Settings ▸ Pages**.
2. Under **Build and deployment ▸ Source**, choose **Deploy from a branch**.
3. Branch: **main**, folder: **/ (root)**. Click **Save**.
4. Wait ~1 minute, refresh. Pages shows your live URL:
   ```
   https://<your-username>.github.io/chardham-ropeway-survey/
   ```

**That link is what you share.** Opening it loads the survey (`index.html`).

---

## Step 5 — Test before sharing widely

1. Open your Pages link, fill one test response, hit **Submit**.
2. Open your Google Sheet — a new row should appear within a few seconds.
3. If it doesn't: re-check that the URL in `config.js` ends in `/exec`, that the
   Apps Script deployment access is **Anyone**, and that you re-uploaded `config.js`
   after editing it.

---

## Notes

- **Source of truth = the Google Sheet.** The in-app dashboard (`dashboard.html`)
  shows only responses stored in *your own* browser, so it's handy for spot-checks but
  is **not** where everyone's answers collect. Do your analysis from the Sheet (or its
  CSV/Excel download).
- **Offline use (important for field work).** Every submission is saved to the device
  *first*, so no answer is ever lost without a signal. If there's no internet, the response
  is **queued** and uploads automatically the next time the browser is online — when the
  device reconnects, or when the enumerator opens the survey/dashboard again. On the
  **dashboard**, a *Pending upload* counter and an **Upload pending to Sheet** button let an
  enumerator confirm/force the flush once they're back in coverage.
  - A **service worker** (`sw.js`) installs the survey as an offline app: open the link
    **once while online**, and afterwards it loads with no signal — even after closing and
    reopening the browser. Submissions pile up locally and sync in bulk on return.
  - To push an update after editing any file (e.g. question changes), bump `CACHE_VERSION`
    in `sw.js` (`v1` → `v2`) and re-upload, so devices fetch the new version.
- **Privacy.** The confidentiality line at Q0.6 and aggregate-only use still apply.
  Anyone with the link can submit, so don't print sensitive identifiers in the public URL.
