// Minimal "installable shell" service worker. No content caching, no Workbox.
// Job #1: exist, so Chrome/Android treat the site as installable.
// Job #2: serve a tiny offline-fallback page when navigation fails with no network.
//
// IMPORTANT: gated course pages under /practices/* re-check entitlement via a
// Supabase-cookie session on every server render (see src/lib/access.ts). This
// worker must never intercept those requests for caching — the fetch handler
// below only touches same-origin navigation requests, and even then only
// falls back to the cached offline page on a network *error*, never caching
// or replacing the real response. The /practices/ guard is redundant with
// that logic but kept explicit so intent survives the next edit.

const CACHE = 'shell-v1';
const OFFLINE_URL = '/offline.html';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.add(OFFLINE_URL)).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.mode !== 'navigate') return;
  if (new URL(request.url).pathname.startsWith('/practices/')) return; // never touch gated routes

  event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL).then((r) => r || Response.error())));
});
