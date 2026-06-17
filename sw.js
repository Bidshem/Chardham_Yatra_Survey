/* =============================================================================
   Char Dham Ropeway Survey — service worker (offline app shell)

   Caches the survey so it loads with no internet, even after the tab/browser is
   closed. Submissions made offline are queued by the app and uploaded when the
   device reconnects (see script.js syncPending()).

   TO PUSH AN UPDATE after you change any file: bump CACHE_VERSION below
   (e.g. v1 -> v2) and re-upload. Old caches are cleared automatically.
   ========================================================================== */
const CACHE_VERSION = "chardham-survey-v1";

// Same-origin files that make up the app. Paths are relative so this works no
// matter what sub-path GitHub Pages serves the repo from.
const APP_SHELL = [
  "./",
  "index.html",
  "dashboard.html",
  "config.js",
  "survey-schema.js",
  "script.js",
  "dashboard.js",
  "style.css",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE_VERSION).then((c) => c.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  // Never intercept POSTs (the submission going to the Google Sheet must hit the network).
  if (req.method !== "GET") return;
  e.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((res) => {
          // Runtime-cache GETs (incl. CDN libraries) so the dashboard works offline too.
          const copy = res.clone();
          caches.open(CACHE_VERSION).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => cached);
    })
  );
});
