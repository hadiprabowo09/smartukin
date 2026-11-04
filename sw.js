/* ==========================================================================
   SMART UKIN TIMER — Service Worker
   Precache seluruh aset aplikasi sehingga berjalan penuh tanpa internet.
   Strategi: cache-first untuk aset aplikasi; navigasi jatuh ke index.html
   dari cache. Naikkan VERSION setiap kali ada berkas yang berubah.
   ========================================================================== */
const VERSION = 'v1.0.0';
const CACHE = 'smart-ukin-timer-' + VERSION;

const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/style.css',
  './js/engine.js',
  './js/templates.js',
  './js/storage.js',
  './js/audio.js',
  './js/pdf.js',
  './js/ui.js',
  './js/app.js',
  './js/pages-main.js',
  './js/pages-live.js',
  './js/pages-data.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(ASSETS.map((u) => new Request(u, { cache: 'reload' }))))
      .then(() => self.clients.matchAll({ includeUncontrolled: true }))
      .then((cs) => cs.forEach((c) => c.postMessage({ type: 'PRECACHED' })))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('smart-ukin-timer-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
      .then(() => self.clients.matchAll())
      .then((cs) => cs.forEach((c) => c.postMessage({ type: 'PRECACHED' })))
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    event.respondWith(
      caches.match('./index.html', { cacheName: CACHE })
        .then((hit) => hit || fetch(req))
        .catch(() => caches.match('./index.html'))
    );
    return;
  }
  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) => {
      if (hit) return hit;
      return fetch(req).then((res) => {
        if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
        return res;
      });
    })
  );
});

self.addEventListener('message', (event) => {
  const data = event.data || {};
  if (data.type === 'SKIP_WAITING') { self.skipWaiting(); return; }
  if (data.type === 'STATUS' && event.ports && event.ports[0]) {
    caches.open(CACHE).then((cache) => Promise.all(ASSETS.map((u) => cache.match(u))))
      .then((res) => event.ports[0].postMessage({ version: VERSION, total: ASSETS.length, cached: res.filter(Boolean).length }))
      .catch(() => event.ports[0].postMessage({ version: VERSION, total: ASSETS.length, cached: 0 }));
  }
});
