const STORAGE_KEY = 'kd_device_id';
const VALID_ID = /^dev_[a-z0-9]{1,32}$/;

/** Reuse the browser identity shared by My Tickets and WhatsApp alerts. */
export function getOrCreateWatchlistDeviceId(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    const current = window.localStorage.getItem(STORAGE_KEY);
    if (current && VALID_ID.test(current)) return current;
  } catch {
    // Private browsing can block localStorage; sessionStorage is a fallback.
  }

  try {
    const current = window.sessionStorage.getItem(STORAGE_KEY);
    if (current && VALID_ID.test(current)) return current;
  } catch {
    // Create a temporary identity below; ticket linkage may not persist.
  }

  const suffix = typeof window.crypto?.randomUUID === 'function'
    ? window.crypto.randomUUID().replace(/-/g, '').slice(0, 24)
    : Math.random().toString(36).slice(2, 14);
  const id = `dev_${suffix.toLowerCase()}`;

  try {
    window.localStorage.setItem(STORAGE_KEY, id);
    return id;
  } catch {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, id);
      return id;
    } catch {
      return null;
    }
  }
}
