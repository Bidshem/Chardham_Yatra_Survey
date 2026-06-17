/* =============================================================================
   Char Dham Ropeway Survey — Google Apps Script backend
   Receives each submission and appends it as a row to a Google Sheet.

   SETUP (see DEPLOY.md for the full walkthrough):
   1. Create a Google Sheet.
   2. Extensions ▸ Apps Script. Delete the sample, paste THIS file.
   3. Deploy ▸ New deployment ▸ type "Web app".
      - Execute as: Me
      - Who has access: Anyone
   4. Copy the Web app URL (ends in /exec) and paste it into config.js.

   Columns are created automatically from the fields received; new fields add
   new columns on the right, so questionnaire tweaks don't break the sheet.
   ========================================================================== */

var SHEET_NAME = 'Responses';

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);

    var record = JSON.parse(e.postData.contents);
    var flat = flatten(record);
    flat['receivedAt'] = new Date();

    var lastCol = sheet.getLastColumn();
    var headers = sheet.getLastRow() === 0 || lastCol === 0
      ? []
      : sheet.getRange(1, 1, 1, lastCol).getValues()[0];

    // Add any new keys as new columns (preserve existing order).
    Object.keys(flat).forEach(function (k) {
      if (headers.indexOf(k) < 0) headers.push(k);
    });
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

    var row = headers.map(function (h) {
      return flat[h] !== undefined && flat[h] !== null ? flat[h] : '';
    });
    sheet.appendRow(row);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

// Simple GET so visiting the URL in a browser confirms the deployment works.
function doGet() {
  return ContentService
    .createTextOutput('Char Dham Ropeway Survey endpoint is live.')
    .setMimeType(ContentService.MimeType.TEXT);
}

// Flatten the response object:
//  - __meta.*  -> meta.<key>
//  - arrays    -> "a; b; c"
//  - objects   -> <id>.<subkey> per cell (household roster, operating costs)
function flatten(obj) {
  var out = {};
  Object.keys(obj).forEach(function (k) {
    var v = obj[k];
    if (k === '__meta' && v && typeof v === 'object') {
      Object.keys(v).forEach(function (mk) { out['meta.' + mk] = v[mk]; });
    } else if (Array.isArray(v)) {
      out[k] = v.join('; ');
    } else if (v && typeof v === 'object') {
      Object.keys(v).forEach(function (sk) { out[k + '.' + sk] = v[sk]; });
    } else {
      out[k] = v;
    }
  });
  return out;
}
