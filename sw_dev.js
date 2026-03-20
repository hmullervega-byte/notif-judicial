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
  // Solo cachear navegacion y assets del sitio, no llamadas a Dropbox API
  const url = new URL(event.request.url);
  if (url.hostname.includes('dropbox') || url.hostname.includes('googleapis')) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cachear copia fresca
        if (response.ok && event.request.method === 'GET') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
