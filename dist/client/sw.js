// Kerala Lottery Results — Progressive Web App Service Worker

const CACHE_NAME = 'kerala-lottery-v2';
const STATIC_ASSETS = [
  '/',
  '/live',
  '/kerala-lottery-result-today',
  '/ticket-checker',
  '/kerala-lottery-results',
  '/my-lotteries',
  '/manifest.json',
  '/favicon.ico',
  '/logo.svg',
];

// 1. Install Event: Pre-cache core shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {});
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
  const req = event.request;

  // STRICT GUARD: Ignore any non-HTTP/HTTPS requests (chrome-extension://, moz-extension://, data:, etc.)
  if (!req.url.startsWith('http://') && !req.url.startsWith('https://')) {
    return;
  }

  let url;
  try {
    url = new URL(req.url);
  } catch {
    return;
  }

  // Only intercept same-origin first-party GET requests
  if (req.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }

  // Skip API routes and Next.js dev websocket
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/_next/webpack-hmr')) {
    return;
  }

  event.respondWith(
    fetch(req)
      .then((response) => {
        // Cache successful first-party responses only
        if (response && response.status === 200 && response.type === 'basic') {
          const resClone = response.clone();
          caches
            .open(CACHE_NAME)
            .then((cache) => {
              cache.put(req, resClone).catch(() => {});
            })
            .catch(() => {});
        }
        return response;
      })
      .catch(() => {
        // Offline fallback to cached version
        return caches.match(req).then((cached) => {
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
    icon: '/logo.svg',
    badge: '/favicon.ico',
    url: '/',
  };

  try {
    if (event.data) {
      data = { ...data, ...event.data.json() };
    }
  } catch (err) {
    console.error('Error parsing push notification data:', err);
  }

  const options = {
    body: data.body,
    icon: data.icon || '/logo.svg',
    badge: data.badge || '/favicon.ico',
    data: { url: data.url || '/' },
    vibrate: [200, 100, 200],
    actions: [
      { action: 'view', title: 'View Result' },
      { action: 'close', title: 'Dismiss' },
    ],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// 5. Notification Click Event: Navigate directly to published result URL
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.navigate(targetUrl).then((c) => c.focus());
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});
