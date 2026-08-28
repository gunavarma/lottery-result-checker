// Kerala Lottery Results — Progressive Web App Service Worker

const CACHE_NAME = 'kerala-lottery-v1';
const STATIC_ASSETS = [
  '/',
  '/live',
  '/kerala-lottery-result-today',
  '/check-ticket',
  '/my-lotteries',
  '/manifest.json',
  '/favicon.ico',
];

// 1. Install Event: Pre-cache core shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('PWA: Pre-caching partial failure', err);
      });
    })
  );
  self.skipWaiting();
});

// 2. Activate Event: Clean up old caches
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
    })
  );
  self.clients.claim();
});

// 3. Fetch Event: Network-first for dynamic live data, cache fallback for offline
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET and API calls from cache interception
  if (event.request.method !== 'GET' || url.pathname.startsWith('/api/')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful HTML / CSS / JS responses
        if (response.status === 200) {
          const resClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, resClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Offline fallback to cached version
        return caches.match(event.request).then((cached) => {
          return (
            cached ||
            caches.match('/') ||
            new Response('Offline - Kerala Lottery Results', {
              headers: { 'Content-Type': 'text/plain' },
            })
          );
        });
      })
  );
});

// 4. Push Notification Event: Receive and display official result alerts
self.addEventListener('push', (event) => {
  let data = {
    title: 'Kerala Lottery Result Published',
    body: 'New official winning numbers are now available.',
    url: '/live',
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: {
      url: data.data?.url || data.url || '/live',
    },
    vibrate: [200, 100, 200],
    actions: [
      { action: 'view', title: 'View Result' },
      { action: 'close', title: 'Dismiss' },
    ],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// 5. Notification Click Event: Navigate to draw result URL
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const targetUrl = event.notification.data?.url || '/live';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
