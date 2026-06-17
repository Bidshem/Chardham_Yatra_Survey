/* =============================================================================
   Char Dham Ropeway Survey — form engine
   - data-driven rendering from SURVEY (survey-schema.js)
   - live conditional logic (routing + gates)
   - per-step validation, localStorage draft + responses, completion screen
   ========================================================================== */

(function () {
  "use strict";

  const STORAGE_RESPONSES = "charDhamRopewaySurvey.responses";
  const STORAGE_DRAFT = "charDhamRopewaySurvey.draft";
  const CONFIG = window.SURVEY_CONFIG || {};

  // Fire-and-forget POST to the Google Apps Script web app (if configured).
  // Uses a "simple" request (text/plain) so the browser sends no CORS preflight;
  // the response is opaque, so the locally-stored copy is the source of truth/backup.
  function postToSheet(record) {
    if (!CONFIG.scriptUrl) return Promise.resolve(false);
    return fetch(CONFIG.scriptUrl, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(record),
    })
      .then(() => true)
      .catch(() => false);
  }

  // ---- state -------------------------------------------------------------
  let answers = {}; // { questionId: value }   value is string | string[] | {key:val}
  let stepIndex = 0; // index into SURVEY modules

  // ---- element refs ------------------------------------------------------
  const el = {
    form: document.getElementById("surveyForm"),
    stepper: document.getElementById("stepper"),
    progressBar: document.getElementById("progressBar"),
    moduleHeader: document.getElementById("moduleHeader"),
    questions: document.getElementById("questions"),
    formError: document.getElementById("formError"),
    prevBtn: document.getElementById("prevBtn"),
    nextBtn: document.getElementById("nextBtn"),
    submitBtn: document.getElementById("submitBtn"),
    saveDraftBtn: document.getElementById("saveDraftBtn"),
    thankYou: document.getElementById("thankYou"),
    thanksMsg: document.getElementById("thanksMsg"),
    newRespBtn: document.getElementById("newRespBtn"),
  };

  // ---- helpers -----------------------------------------------------------
  const esc = (s) =>
    String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function moduleVisible(mod) {
    return typeof mod.showIf === "function" ? mod.showIf(answers) : true;
  }

  // Modules that should be shown given current answers (drives the stepper).
  function visibleModules() {
    return SURVEY.filter(moduleVisible);
  }

  function questionVisible(q) {
    return typeof q.showIf === "function" ? q.showIf(answers) : true;
  }

  // Options for a single question, with "Don't know / Refused" appended unless suppressed.
  function singleOptions(q) {
    const opts = q.options ? q.options.slice() : [];
    if (q.type === "single" && !q.noDKR && !opts.includes(DKR)) opts.push(DKR);
    return opts;
  }

  // ---- rendering ---------------------------------------------------------
  function renderStepper() {
    const mods = visibleModules();
    el.stepper.innerHTML = mods
      .map((m, i) => {
        const cls = i === stepIndex ? "step current" : i < stepIndex ? "step done" : "step";
        const num = m.subtitle && /Module\s+(\w+)/.exec(m.subtitle);
        const lbl = num ? num[1] : i;
        return `<button type="button" class="${cls}" data-step="${i}" title="${esc(m.title)}">${esc(lbl)}</button>`;
      })
      .join("");
    const pct = mods.length > 1 ? Math.round((stepIndex / (mods.length - 1)) * 100) : 0;
    el.progressBar.style.width = pct + "%";
  }

  function renderQuestion(q) {
    if (!questionVisible(q)) return "";
    const v = answers[q.id];

    if (q.type === "note") {
      return `<div class="q-note">${esc(q.label)}</div>`;
    }

    const reqMark = q.required ? ' <span class="req">*</span>' : "";
    let body = "";

    switch (q.type) {
      case "text":
        body = `<input type="text" class="inp" data-qid="${q.id}" value="${esc(v || "")}" />`;
        break;
      case "date":
        body = `<input type="date" class="inp" data-qid="${q.id}" value="${esc(v || "")}" />`;
        break;
      case "num":
        body = `<div class="num-wrap"><input type="number" class="inp" data-qid="${q.id}" value="${esc(v == null ? "" : v)}" min="0" step="any" />${
          q.unit ? `<span class="unit">${esc(q.unit)}</span>` : ""
        }</div>`;
        break;
      case "single": {
        const opts = singleOptions(q);
        body =
          `<div class="opts">` +
          opts
            .map(
              (o) =>
                `<label class="opt${v === o ? " sel" : ""}"><input type="radio" name="${q.id}" data-qid="${q.id}" value="${esc(
                  o
                )}" ${v === o ? "checked" : ""}/><span>${esc(o)}</span></label>`
            )
            .join("") +
          `</div>`;
        break;
      }
      case "multi": {
        const arr = Array.isArray(v) ? v : [];
        body =
          `<div class="opts">` +
          q.options
            .map(
              (o) =>
                `<label class="opt${arr.includes(o) ? " sel" : ""}"><input type="checkbox" data-qid="${q.id}" data-multi="1" value="${esc(
                  o
                )}" ${arr.includes(o) ? "checked" : ""}/><span>${esc(o)}</span></label>`
            )
            .join("") +
          `</div>`;
        break;
      }
      case "scale": {
        const cur = v == null ? "" : String(v);
        body =
          `<div class="scale">` +
          [1, 2, 3, 4, 5]
            .map(
              (n) =>
                `<label class="scale-pt${cur === String(n) ? " sel" : ""}"><input type="radio" name="${q.id}" data-qid="${q.id}" value="${n}" ${
                  cur === String(n) ? "checked" : ""
                }/><span>${n}</span></label>`
            )
            .join("") +
          `</div>`;
        break;
      }
      case "sgrid": {
        body =
          `<table class="sgrid"><tbody>` +
          q.rows
            .map((r) => {
              const rv = answers[r.id];
              const pills = r.options
                .map(
                  (o) =>
                    `<label class="opt${rv === o ? " sel" : ""}"><input type="radio" name="${r.id}" data-qid="${r.id}" value="${esc(
                      o
                    )}" ${rv === o ? "checked" : ""}/><span>${esc(o)}</span></label>`
                )
                .join("");
              return `<tr><td class="sgrid-label"><span class="q-id">${esc(r.id)}</span> ${esc(r.label)}</td><td><div class="opts">${pills}</div></td></tr>`;
            })
            .join("") +
          `</tbody></table>`;
        break;
      }
      case "numgrid": {
        const obj = v && typeof v === "object" ? v : {};
        body =
          `<div class="grid">` +
          q.fields
            .map(
              (f) =>
                `<div class="grid-cell"><label>${esc(f.label)}</label><input type="number" class="inp" data-qid="${q.id}" data-gridkey="${esc(
                  f.key
                )}" value="${esc(obj[f.key] == null ? "" : obj[f.key])}" min="0" step="any" /></div>`
            )
            .join("") +
          `</div>`;
        break;
      }
      default:
        body = "";
    }

    return `<div class="q" data-q="${q.id}"><div class="q-label"><span class="q-id">${esc(q.id)}</span> ${esc(
      q.label
    )}${reqMark}</div>${body}</div>`;
  }

  function renderStep(scrollTop) {
    const mods = visibleModules();
    // clamp
    if (stepIndex > mods.length - 1) stepIndex = mods.length - 1;
    if (stepIndex < 0) stepIndex = 0;
    const mod = mods[stepIndex];

    el.moduleHeader.innerHTML = `<h2>${esc(mod.title)}</h2><div class="module-sub">${esc(mod.subtitle || "")}</div>`;
    el.questions.innerHTML = mod.questions.map(renderQuestion).join("");

    el.prevBtn.disabled = stepIndex === 0;
    const isLast = stepIndex === mods.length - 1;
    el.nextBtn.hidden = isLast;
    el.submitBtn.hidden = !isLast;
    hideError();
    renderStepper();
    if (scrollTop) window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ---- reading the DOM into `answers` -----------------------------------
  function collectStep() {
    const inputs = el.questions.querySelectorAll("[data-qid]");
    // gather multi groups first
    const multiGroups = {};
    inputs.forEach((node) => {
      const qid = node.getAttribute("data-qid");
      if (node.getAttribute("data-multi")) {
        multiGroups[qid] = multiGroups[qid] || [];
        if (node.checked) multiGroups[qid].push(node.value);
        return;
      }
      if (node.type === "radio") {
        if (node.checked) answers[qid] = node.value;
        return;
      }
      if (node.getAttribute("data-gridkey")) {
        const key = node.getAttribute("data-gridkey");
        const obj = answers[qid] && typeof answers[qid] === "object" ? answers[qid] : {};
        if (node.value === "") delete obj[key];
        else obj[key] = node.value;
        answers[qid] = obj;
        return;
      }
      // text / num / date
      if (node.value === "") delete answers[qid];
      else answers[qid] = node.value;
    });
    Object.keys(multiGroups).forEach((qid) => {
      if (multiGroups[qid].length) answers[qid] = multiGroups[qid];
      else delete answers[qid];
    });

    applyPiping();
  }

  // Piping: reuse values asked once (animal count 2.6 -> 6.3).
  function applyPiping() {
    if (answers["2.6"] != null && answers["2.6"] !== "" && answers["6.1"] === "Yes") {
      if (answers["6.3"] == null || answers["6.3"] === "") answers["6.3"] = answers["2.6"];
    }
  }

  // ---- validation --------------------------------------------------------
  function validateStep() {
    const mods = visibleModules();
    const mod = mods[stepIndex];
    const missing = [];
    mod.questions.forEach((q) => {
      if (!q.required || q.type === "note") return;
      if (!questionVisible(q)) return;
      const v = answers[q.id];
      let empty = v == null || v === "";
      if (Array.isArray(v)) empty = v.length === 0;
      if (v && typeof v === "object" && !Array.isArray(v)) {
        // numgrid: require at least the first field
        empty = q.fields ? answers[q.id][q.fields[0].key] == null || answers[q.id][q.fields[0].key] === "" : Object.keys(v).length === 0;
      }
      if (empty) missing.push(q);
    });

    el.questions.querySelectorAll(".q.invalid").forEach((n) => n.classList.remove("invalid"));
    if (missing.length) {
      missing.forEach((q) => {
        const node = el.questions.querySelector(`.q[data-q="${CSS.escape(q.id)}"]`);
        if (node) node.classList.add("invalid");
      });
      showError(`Please answer the highlighted required question${missing.length > 1 ? "s" : ""} (${missing.map((m) => m.id).join(", ")}).`);
      const first = el.questions.querySelector(".q.invalid");
      if (first) first.scrollIntoView({ behavior: "smooth", block: "center" });
      return false;
    }
    return true;
  }

  function showError(msg) {
    el.formError.textContent = msg;
    el.formError.hidden = false;
  }
  function hideError() {
    el.formError.hidden = true;
  }

  // ---- navigation --------------------------------------------------------
  function goNext() {
    collectStep();
    if (!validateStep()) return;
    saveDraft();
    // visibleModules() collapses to just Module 0 when consent is No, so "Next" becomes Submit.
    stepIndex++;
    renderStep(true);
  }

  function goPrev() {
    collectStep();
    saveDraft();
    stepIndex--;
    renderStep(true);
  }

  function submit() {
    collectStep();
    if (!validateStep()) return;

    const record = Object.assign({}, answers);
    record.__meta = {
      submittedAt: new Date().toISOString(),
      path: typeof pathOf === "function" ? pathOf(answers) : null,
      consent: answers["0.6"] || null,
      cid: Date.now() + "-" + Math.random().toString(36).slice(2, 8), // client id for sync matching
      synced: false,
    };

    const all = loadResponses();
    all.push(record);
    saveResponses(all);
    localStorage.removeItem(STORAGE_DRAFT);

    // Try to push this (and any earlier offline backlog) to the Google Sheet.
    syncPending();

    el.form.hidden = true;
    el.stepper.style.display = "none";
    document.querySelector(".progress-track").style.display = "none";
    el.thankYou.hidden = false;
    el.thanksMsg.textContent =
      answers["0.6"] === "No"
        ? "Recorded as a non-consent contact. Thank you."
        : CONFIG.scriptUrl
        ? `Thank you. Response #${all.length} saved on this device. It will upload automatically — now if online, or as soon as a connection is available.`
        : `Thank you. Response #${all.length} saved locally on this device.`;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function startNew() {
    answers = {};
    stepIndex = 0;
    localStorage.removeItem(STORAGE_DRAFT);
    el.thankYou.hidden = true;
    el.form.hidden = false;
    el.stepper.style.display = "";
    document.querySelector(".progress-track").style.display = "";
    renderStep(true);
  }

  // ---- persistence -------------------------------------------------------
  function loadResponses() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_RESPONSES)) || [];
    } catch (e) {
      return [];
    }
  }
  function saveResponses(all) {
    localStorage.setItem(STORAGE_RESPONSES, JSON.stringify(all));
  }

  // Resend every locally-stored response that hasn't been confirmed sent.
  // Runs on submit, on page load, and whenever the browser reports it's back online.
  let syncing = false;
  function syncPending() {
    if (!CONFIG.scriptUrl || syncing) return;
    const pending = loadResponses().filter((r) => !(r.__meta && r.__meta.synced));
    if (!pending.length) return;
    syncing = true;
    (function next(i) {
      if (i >= pending.length) {
        syncing = false;
        return;
      }
      const rec = pending[i];
      postToSheet(rec).then((ok) => {
        if (ok && rec.__meta) {
          const cur = loadResponses();
          const t = cur.find((x) => x.__meta && x.__meta.cid === rec.__meta.cid);
          if (t) {
            t.__meta.synced = true;
            saveResponses(cur);
          }
        }
        next(i + 1); // stop trying further items once one fails (likely offline)? keep going; harmless
      });
    })(0);
  }

  window.addEventListener("online", syncPending);
  function saveDraft() {
    localStorage.setItem(STORAGE_DRAFT, JSON.stringify({ answers, stepIndex }));
  }
  function loadDraft() {
    try {
      const d = JSON.parse(localStorage.getItem(STORAGE_DRAFT));
      if (d && d.answers) {
        answers = d.answers;
        stepIndex = d.stepIndex || 0;
        return true;
      }
    } catch (e) {}
    return false;
  }

  // ---- events ------------------------------------------------------------
  // 'input' fires on every keystroke -> just capture values (no re-render, keeps focus).
  el.questions.addEventListener("input", function () {
    collectStep();
  });
  // 'change' fires on radio/checkbox/select toggle and on blur of text/num ->
  // re-render so conditional branches open/close live.
  el.questions.addEventListener("change", function () {
    collectStep();
    renderStep();
  });

  el.nextBtn.addEventListener("click", goNext);
  el.prevBtn.addEventListener("click", goPrev);
  el.submitBtn.addEventListener("click", submit);
  el.newRespBtn.addEventListener("click", startNew);
  el.saveDraftBtn.addEventListener("click", function () {
    collectStep();
    saveDraft();
    showError("");
    el.formError.hidden = false;
    el.formError.classList.add("ok");
    el.formError.textContent = "Draft saved on this device.";
    setTimeout(() => {
      el.formError.classList.remove("ok");
      el.formError.hidden = true;
    }, 1800);
  });

  el.stepper.addEventListener("click", function (e) {
    const btn = e.target.closest("[data-step]");
    if (!btn) return;
    const target = parseInt(btn.getAttribute("data-step"), 10);
    collectStep();
    // allow jumping back freely; jumping forward only if current step validates
    if (target > stepIndex && !validateStep()) return;
    saveDraft();
    stepIndex = target;
    renderStep(true);
  });

  // ---- init --------------------------------------------------------------
  loadDraft();
  renderStep();
  syncPending(); // flush any responses queued while offline in a previous session
})();
