import type { FirebaseApp } from 'firebase/app';
import type { Messaging } from 'firebase/messaging';
import {
  FIREBASE_API_KEY,
  FIREBASE_APP_ID,
  FIREBASE_AUTH_DOMAIN,
  FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET,
  VAPID_PUBLIC_KEY,
} from '@/lib/public-env';

// Values come from `import.meta.env` through `lib/public-env.ts`: the browser
// has no `process.env`, so reading it here (as the Next.js build allowed) left
// every visitor on the placeholder credentials below.
export const firebaseConfig = {
  apiKey: FIREBASE_API_KEY || 'AIzaSyDemoDummyApiKeyForFirebase12345',
  authDomain: FIREBASE_AUTH_DOMAIN || 'kerala-lottery-results.firebaseapp.com',
  projectId: FIREBASE_PROJECT_ID || 'kerala-lottery-results',
  storageBucket: FIREBASE_STORAGE_BUCKET || 'kerala-lottery-results.appspot.com',
  messagingSenderId: FIREBASE_MESSAGING_SENDER_ID || '123456789012',
  appId: FIREBASE_APP_ID || '1:123456789012:web:abcdef1234567890',
};

export function isFirebaseConfigured(): boolean {
  return Boolean(
    FIREBASE_API_KEY &&
    !FIREBASE_API_KEY.includes('Dummy') &&
    FIREBASE_PROJECT_ID &&
    !FIREBASE_PROJECT_ID.includes('dummy')
  );
}

let clientApp: FirebaseApp | null = null;
let clientMessaging: Messaging | null = null;

export async function getClientFirebaseApp(): Promise<FirebaseApp | null> {
  if (typeof window === 'undefined' || !isFirebaseConfigured()) {
    return null;
  }

  if (clientApp) return clientApp;

  try {
    const { initializeApp, getApps, getApp } = await import('firebase/app');
    if (getApps().length > 0) {
      clientApp = getApp();
    } else {
      clientApp = initializeApp(firebaseConfig);
    }
    return clientApp;
  } catch {
    return null;
  }
}

export async function getClientMessaging(): Promise<Messaging | null> {
  if (typeof window === 'undefined' || !isFirebaseConfigured()) return null;
  if (clientMessaging) return clientMessaging;

  try {
    const { getMessaging, isSupported } = await import('firebase/messaging');
    const supported = await isSupported().catch(() => false);
    if (!supported) {
      return null;
    }

    const app = await getClientFirebaseApp();
    if (!app) return null;
    clientMessaging = getMessaging(app);
    return clientMessaging;
  } catch {
    return null;
  }
}

/**
 * Request FCM Push Token from browser
 */
export async function requestFcmToken(customVapidKey?: string): Promise<string | null> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    throw new Error('Notifications are not supported in this browser environment.');
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error(`Notification permission ${permission}`);
  }

  const messaging = await getClientMessaging();
  if (!messaging) {
    if (process.env.NODE_ENV !== 'production') {
      return `fcm_dev_mock_token_${Date.now()}`;
    }
    throw new Error('FCM Messaging is not supported in this browser.');
  }

  // Ensure service worker is registered
  let swRegistration: ServiceWorkerRegistration | undefined;
  if ('serviceWorker' in navigator) {
    try {
      swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    } catch {
      swRegistration = await navigator.serviceWorker.ready.catch(() => undefined);
    }
  }

  const vapidKey =
    customVapidKey ||
    VAPID_PUBLIC_KEY ||
    'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBKr3qBUYIhbQFLXYp5Nksh8U';

  try {
    const { getToken } = await import('firebase/messaging');
    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: swRegistration,
    });
    return token;
  } catch (tokenErr: any) {
    console.error('Error retrieving FCM token:', tokenErr);
    // If running in development without live FCM keys, return mock token for testing.
    // `FIREBASE_API_KEY` is the inlined public value; reading `process.env` here
    // is always undefined in the browser, so this branch would have fired even
    // with real credentials configured.
    if (import.meta.env.DEV && !FIREBASE_API_KEY) {
      return `fcm_dev_mock_token_${Date.now()}`;
    }
    throw tokenErr;
  }
}

/**
 * Subscribe to Foreground FCM Notifications (lazy-loaded on idle)
 */
export function onForegroundFcmMessage(callback: (payload: any) => void): () => void {
  if (typeof window === 'undefined' || !isFirebaseConfigured()) return () => {};

  let unsubscribe: (() => void) | undefined;
  let cancelled = false;

  const init = async () => {
    try {
      const messaging = await getClientMessaging();
      if (messaging && !cancelled) {
        const { onMessage } = await import('firebase/messaging');
        unsubscribe = onMessage(messaging, (payload) => {
          callback(payload);
        });
      }
    } catch {
      // Ignore background registration errors
    }
  };

  // Wait until main thread is idle so Firebase is not in the critical path
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(init);
  } else {
    setTimeout(init, 3000);
  }

  return () => {
    cancelled = true;
    if (typeof unsubscribe === 'function') unsubscribe();
  };
}
