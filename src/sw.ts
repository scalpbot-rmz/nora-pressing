/// <reference lib="webworker" />

const sw = self as unknown as ServiceWorkerGlobalScope;

const CACHE_NAME = 'nora-pressing-v1';
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/dashboard/orders',
  '/dashboard/orders/new',
  '/dashboard/customers',
  '/dashboard/offers',
  '/dashboard/expenses',
  '/dashboard/settings',
  '/offline',
  '/manifest.webmanifest',
  '/favicon.ico',
  '/assets/logo.jpg',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

sw.addEventListener('install', (event: ExtendableEvent) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log('[ServiceWorker] Caching app shell and static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => sw.skipWaiting())
  );
});

sw.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cache) => {
            if (cache !== CACHE_NAME) {
              console.log('[ServiceWorker] Removing old cache:', cache);
              return caches.delete(cache);
            }
          })
        );
      })
      .then(() => sw.clients.claim())
  );
});

sw.addEventListener('fetch', (event: FetchEvent) => {
  const request = event.request;

  if (request.method !== 'GET' || request.url.includes('supabase.co')) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(request, networkResponse));
            }
          })
          .catch(() => {});

        return cachedResponse;
      }

      return fetch(request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }

          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });

          return networkResponse;
        })
        .catch(() => {
          if (request.mode === 'navigate') {
            return caches.match('/offline') as Promise<Response>;
          }
          return new Response('Hors ligne', { status: 503, statusText: 'Service Unavailable' });
        });
    })
  );
});
