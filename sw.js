// sw.js — Digital Smart Communications
// Minimal service worker: enables PWA installability + basic offline fallback.

const CACHE_NAME = 'dsc-app-cache-v1';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

// Install: pre-cache core files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .catch((err) => console.log('SW cache addAll failed (non-fatal):', err))
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch: network-first for navigation/HTML, cache-first fallback for everything else.
// Supabase / API calls always go to network (never cached) so data stays live.
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Only handle GET requests
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Never intercept cross-origin calls (Supabase API, CDN scripts, fonts) —
  // let the browser handle them normally so sync/login never breaks.
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(req)
      .then((res) => {
        // Update cache with fresh copy
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
        return res;
      })
      .catch(() =>
        // Offline fallback: serve from cache if available
        caches.match(req).then((cached) => cached || caches.match('./index.html'))
      )
  );
});
