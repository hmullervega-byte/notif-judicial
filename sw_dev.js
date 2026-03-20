const CACHE_NAME = 'notif-dev-v1';
const URLS_TO_CACHE = [
  '/notif-judicial/webapp_dev.html',
  '/notif-judicial/manifest_dev.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(URLS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  // No interceptar Dropbox API ni Google Fonts
  const url = new URL(event.request.url);
  if (url.hostname.includes('dropbox') || url.hostname.includes('googleapis')) return;
  if (event.request.method !== 'GET') return;

  // Stale While Revalidate: servir caché inmediato + actualizar en background
  event.respondWith(
    caches.open(CACHE_NAME).then(cache =>
      cache.match(event.request).then(cached => {
        const fetchPromise = fetch(event.request).then(response => {
          if (response.ok) cache.put(event.request, response.clone());
          return response;
        }).catch(() => cached);

        // Si hay caché, servir inmediato; si no, esperar red
        return cached || fetchPromise;
      })
    )
  );
});
