/* ==========================================================================
   GN SLIDES PRO 4K - SERVICE WORKER (PWA OFFLINE & APP INSTALLATION)
   ========================================================================== */

const CACHE_NAME = 'gn-slides-pro-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './vendas.html',
  './css/styles.css',
  './js/app.js',
  './js/license-system.js',
  './js/slideshow-engine.js',
  './js/audio-engine.js',
  './js/video-exporter.js',
  './js/project-storage.js',
  './js/demo-assets.js',
  './js/auth-system.js',
  './manifest.json',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Network first strategy with fallback to cache
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});
