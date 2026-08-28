// Firebase Cloud Messaging (FCM) Service Worker for Kerala Lottery Results

importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: 'AIzaSyDemoDummyApiKeyForFirebase12345',
  authDomain: 'kerala-lottery-results.firebaseapp.com',
  projectId: 'kerala-lottery-results',
  storageBucket: 'kerala-lottery-results.appspot.com',
  messagingSenderId: '123456789012',
  appId: '1:123456789012:web:abcdef1234567890',
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// 1. Handle Background FCM Notifications
messaging.onBackgroundMessage((payload) => {
  const notificationTitle =
    payload.notification?.title ||
    payload.data?.title ||
    '🟢 Kerala Lottery Result';

  const notificationOptions = {
    body:
      payload.notification?.body ||
      payload.data?.body ||
      'Official Kerala State Lottery result has been published.',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: {
      url: payload.data?.url || '/live',
      resultId: payload.data?.resultId,
      drawNumber: payload.data?.drawNumber,
    },
    vibrate: [200, 100, 200],
    actions: [
      { action: 'view', title: 'View Result' },
      { action: 'close', title: 'Dismiss' },
    ],
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// 2. Handle Notification Clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const targetUrl = event.notification.data?.url || '/live';

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(targetUrl) && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});
