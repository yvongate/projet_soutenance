// Service worker BiblioSmart : cache hors-ligne (réseau d'abord) + notifications push.

const CACHE = 'bibliosmart-v1';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.add('/offline'))
      .catch(() => undefined)
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

// Stratégie « réseau d'abord » : toujours du frais quand on est en ligne
// (ne casse pas le rechargement à chaud en dev), repli sur le cache hors-ligne.
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  // On ne gère que le même origine (l'API est sur un autre port → ignorée).
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        // On ne met en cache que les réponses valides (pas les 404/500)
        if (response.ok) {
          const copie = response.clone();
          caches
            .open(CACHE)
            .then((c) => c.put(request, copie).catch(() => undefined));
        }
        return response;
      })
      .catch(() =>
        caches
          .match(request)
          .then((cached) =>
            cached ||
            (request.mode === 'navigate' ? caches.match('/offline') : undefined),
          ),
      ),
  );
});

// ---- Notifications push ----
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: 'BiblioSmart', body: event.data ? event.data.text() : '' };
  }
  const title = data.title || 'BiblioSmart';
  const options = { body: data.body || '', data: { url: data.url || '/' } };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(self.clients.openWindow(url));
});
