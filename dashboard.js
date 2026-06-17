/* =============================================================================
   Char Dham Ropeway Survey — Dashboard
   - reads responses from localStorage
   - summary stats + Chart.js charts
   - flat table preview + CSV / XLSX export
   ========================================================================== */

(function () {
  "use strict";

  const STORAGE_RESPONSES = "charDhamRopewaySurvey.responses";
  const CONFIG = window.SURVEY_CONFIG || {};

  // Build a flat ordered list of every question id + label across all modules.
  const COLUMNS = [];
  SURVEY.forEach((mod) => {
    mod.questions.forEach((q) => {
      if (q.type === "note") return;
      if (q.type === "numgrid") {
        q.fields.forEach((f) => COLUMNS.push({ id: `${q.id}.${f.key}`, label: `${q.id} ${q.label} — ${f.label}` }));
      } else if (q.type === "sgrid") {
        q.rows.forEach((r) => COLUMNS.push({ id: r.id, label: `${r.id} ${r.label}` }));
      } else {
        COLUMNS.push({ id: q.id, label: `${q.id} ${q.label}` });
      }
    });
  });

  const charts = {};

  function loadResponses() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_RESPONSES)) || [];
    } catch (e) {
      return [];
    }
  }

  // Resolve a column value (handles numgrid "id.key" and array multi values).
  function cellValue(rec, colId) {
    if (colId.indexOf(".") > -1) {
      // could be a real qid like "0.1" OR a grid "5A.6.feed". Try direct first.
      if (Object.prototype.hasOwnProperty.call(rec, colId)) return fmt(rec[colId]);
      const parts = colId.split(".");
      const key = parts.pop();
      const base = parts.join(".");
      const obj = rec[base];
      if (obj && typeof obj === "object" && !Array.isArray(obj)) return fmt(obj[key]);
      // fall through: maybe the qid itself contains a dot (e.g. 0.1)
      return fmt(rec[colId]);
    }
    return fmt(rec[colId]);
  }

  function fmt(v) {
    if (v == null) return "";
    if (Array.isArray(v)) return v.join("; ");
    if (typeof v === "object") return Object.entries(v).map(([k, x]) => `${k}=${x}`).join("; ");
    return String(v);
  }

  // ---- counting helper for charts ---------------------------------------
  function countBy(responses, fn) {
    const out = {};
    responses.forEach((r) => {
      const vals = fn(r);
      (Array.isArray(vals) ? vals : [vals]).forEach((v) => {
        if (v == null || v === "") return;
        out[v] = (out[v] || 0) + 1;
      });
    });
    return out;
  }

  const PALETTE = ["#1f6f5c", "#c97a2b", "#2b3a72", "#7a9e3a", "#9b4dca", "#c0392b", "#0e7c86", "#d4a017", "#5b6b7b"];

  function drawBar(canvasId, dataObj, horizontal) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    if (charts[canvasId]) charts[canvasId].destroy();
    const labels = Object.keys(dataObj);
    charts[canvasId] = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [{ data: labels.map((l) => dataObj[l]), backgroundColor: labels.map((_, i) => PALETTE[i % PALETTE.length]) }],
      },
      options: {
        indexAxis: horizontal ? "y" : "x",
        plugins: { legend: { display: false } },
        scales: { x: { ticks: { autoSkip: false } }, y: { beginAtZero: true, ticks: { precision: 0 } } },
        responsive: true,
        maintainAspectRatio: false,
      },
    });
  }

  function drawDoughnut(canvasId, dataObj) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    if (charts[canvasId]) charts[canvasId].destroy();
    const labels = Object.keys(dataObj);
    charts[canvasId] = new Chart(ctx, {
      type: "doughnut",
      data: { labels, datasets: [{ data: labels.map((l) => dataObj[l]), backgroundColor: labels.map((_, i) => PALETTE[i % PALETTE.length]) }] },
      options: { plugins: { legend: { position: "bottom", labels: { boxWidth: 12, font: { size: 11 } } } }, responsive: true, maintainAspectRatio: false },
    });
  }

  // ---- render ------------------------------------------------------------
  function render() {
    const responses = loadResponses();
    renderStats(responses);
    renderCharts(responses);
    renderTable(responses);
    refreshSyncUI();
  }

  // ---- sync (mirror of survey-side logic, for manual flush from dashboard) --
  function saveResponses(all) {
    localStorage.setItem(STORAGE_RESPONSES, JSON.stringify(all));
  }
  function pendingCount() {
    if (!CONFIG.scriptUrl) return 0;
    return loadResponses().filter((r) => !(r.__meta && r.__meta.synced)).length;
  }
  let syncing = false;
  function syncNow(done) {
    if (!CONFIG.scriptUrl || syncing) return;
    const pending = loadResponses().filter((r) => !(r.__meta && r.__meta.synced));
    if (!pending.length) {
      if (done) done();
      return;
    }
    syncing = true;
    (function next(i) {
      if (i >= pending.length) {
        syncing = false;
        if (done) done();
        return;
      }
      const rec = pending[i];
      fetch(CONFIG.scriptUrl, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(rec),
      })
        .then(() => {
          const cur = loadResponses();
          const t = cur.find((x) => x.__meta && x.__meta.cid === rec.__meta.cid);
          if (t) {
            t.__meta.synced = true;
            saveResponses(cur);
          }
        })
        .catch(function () {})
        .then(() => next(i + 1));
    })(0);
  }

  function refreshSyncUI() {
    const btn = document.getElementById("syncNow");
    const n = pendingCount();
    if (CONFIG.scriptUrl) {
      btn.hidden = false;
      btn.textContent = n ? `Upload ${n} pending to Sheet` : "All uploaded ✓";
      btn.disabled = n === 0;
    } else {
      btn.hidden = true;
    }
  }

  function renderStats(responses) {
    const consented = responses.filter((r) => r["0.6"] !== "No").length;
    const byPath = countBy(responses, (r) => (r.__meta && r.__meta.path) || (typeof pathOf === "function" ? pathOf(r) : null));
    const support = responses.filter((r) => r["9.5"] === "Support" || r["9.5"] === "Strongly support").length;
    const stats = [
      { num: responses.length, label: "Total responses" },
      { num: consented, label: "Consented" },
      { num: byPath.A || 0, label: "Path A — mobile" },
      { num: byPath.B || 0, label: "Path B — fixed" },
      { num: byPath.C || 0, label: "Path C — other" },
      { num: support, label: "Support project" },
    ];
    if (CONFIG.scriptUrl) stats.push({ num: pendingCount(), label: "Pending upload" });
    document.getElementById("stats").innerHTML = stats
      .map((s) => `<div class="stat"><div class="stat-num">${s.num}</div><div class="stat-label">${s.label}</div></div>`)
      .join("");
  }

  function renderCharts(responses) {
    drawDoughnut("chartPath", countBy(responses, (r) => {
      const p = (r.__meta && r.__meta.path) || (typeof pathOf === "function" ? pathOf(r) : null);
      return p ? "Path " + p : "Unknown";
    }));
    drawBar("chartCategory", countBy(responses, (r) => r["0.5"]), true);
    drawBar("chartSupport", countBy(responses, (r) => r["9.5"]), true);
    drawDoughnut("chartIncome", countBy(responses, (r) => r["10.2"]));
    drawBar("chartLocation", countBy(responses, (r) => r["0.4"]), true);
    drawDoughnut("chartReskill", countBy(responses, (r) => r["11.6"]));
  }

  function renderTable(responses) {
    const table = document.getElementById("respTable");
    if (!responses.length) {
      table.innerHTML = `<tr><td class="empty">No responses yet. Fill in the <a href="index.html">survey</a> to see data here.</td></tr>`;
      return;
    }
    // Show a compact, useful subset of columns in the on-screen table; full set goes to export.
    const KEYS = ["0.1", "0.2", "0.4", "0.5", "1.1", "1.2", "1.5", "4.4", "7.1", "9.5", "10.2", "11.6"];
    const head =
      `<tr><th>#</th><th>Path</th>` +
      KEYS.map((k) => {
        const col = COLUMNS.find((c) => c.id === k);
        return `<th>${col ? col.label : k}</th>`;
      }).join("") +
      `<th>Submitted</th></tr>`;

    const rows = responses
      .map((r, i) => {
        const path = (r.__meta && r.__meta.path) || (typeof pathOf === "function" ? pathOf(r) : "");
        const cells = KEYS.map((k) => `<td>${escapeHtml(cellValue(r, k))}</td>`).join("");
        const when = r.__meta && r.__meta.submittedAt ? new Date(r.__meta.submittedAt).toLocaleString() : "";
        return `<tr><td>${i + 1}</td><td>${path ? `<span class="badge ${path}">${path}</span>` : ""}</td>${cells}<td>${escapeHtml(when)}</td></tr>`;
      })
      .join("");
    table.innerHTML = head + rows;
  }

  function escapeHtml(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  // ---- export ------------------------------------------------------------
  function buildMatrix() {
    const responses = loadResponses();
    const header = ["#", "path", "consent", "submittedAt"].concat(COLUMNS.map((c) => c.label));
    const rows = responses.map((r, i) => {
      const meta = r.__meta || {};
      const base = [i + 1, meta.path || "", meta.consent || r["0.6"] || "", meta.submittedAt || ""];
      return base.concat(COLUMNS.map((c) => cellValue(r, c.id)));
    });
    return { header, rows };
  }

  function exportCSV() {
    const { header, rows } = buildMatrix();
    const escCsv = (v) => {
      const s = String(v == null ? "" : v);
      return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    };
    const csv = [header].concat(rows).map((row) => row.map(escCsv).join(",")).join("\r\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    downloadBlob(blob, `chardham_ropeway_responses_${stamp()}.csv`);
  }

  function exportXLSX() {
    const { header, rows } = buildMatrix();
    const ws = XLSX.utils.aoa_to_sheet([header].concat(rows));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Responses");
    XLSX.writeFile(wb, `chardham_ropeway_responses_${stamp()}.xlsx`);
  }

  function stamp() {
    const d = new Date();
    const p = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}`;
  }

  function downloadBlob(blob, name) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ---- events ------------------------------------------------------------
  document.getElementById("exportCsv").addEventListener("click", exportCSV);
  document.getElementById("exportXlsx").addEventListener("click", exportXLSX);
  document.getElementById("syncNow").addEventListener("click", function () {
    const btn = this;
    btn.disabled = true;
    btn.textContent = "Uploading…";
    syncNow(function () {
      render();
    });
  });
  window.addEventListener("online", function () {
    syncNow(render);
  });
  document.getElementById("clearAll").addEventListener("click", function () {
    if (!loadResponses().length) return;
    if (confirm("Delete ALL stored responses on this device? Export first if you need a backup. This cannot be undone.")) {
      localStorage.removeItem(STORAGE_RESPONSES);
      render();
    }
  });

  render();
})();
