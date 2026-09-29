/**
 * High-Performance In-Memory Cache with Stale-While-Revalidate (SWR) for KeralaDraws
 * Prevents database bottlenecks and ensures sub-10ms response times for public visitors.
 */

interface CacheEntry<T> {
  data: T;
  cachedAt: number;
  ttlMs: number;
  swrMs: number;
}

/**
 * Successfully published results are immutable — a stored draw never changes —
 * so during a database outage the last good copy is still *correct*, just not
 * newest. Half an hour is generous enough to ride out pooler exhaustion and
 * short enough that a genuinely stale page cannot persist.
 */
export const PUBLISHED_DATA_STALE_IF_ERROR_MS = 30 * 60_000;

/**
 * Today's snapshot and the live state machine change through the day, so their
 * last-good copy is served for a shorter window before failing loudly.
 */
export const LIVE_DATA_STALE_IF_ERROR_MS = 15 * 60_000;

const memoryCache = new Map<string, CacheEntry<any>>();
// When a cold or expired key is requested concurrently, all callers should
// share one database read instead of stampeding the database.
const inFlightFetches = new Map<string, Promise<unknown>>();

function refreshCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs: number,
  swrMs: number
): Promise<T> {
  const activeFetch = inFlightFetches.get(key) as Promise<T> | undefined;
  if (activeFetch) return activeFetch;

  const refresh = fetcher()
    .then((freshData) => {
      memoryCache.set(key, { data: freshData, cachedAt: Date.now(), ttlMs, swrMs });
      return freshData;
    })
    .finally(() => inFlightFetches.delete(key));

  inFlightFetches.set(key, refresh);
  return refresh;
}

export interface CacheOptions {
  ttlMs?: number; // Time in ms before considered stale (default: 30 seconds)
  swrMs?: number; // Time in ms data can be served stale while refreshing in background (default: 5 minutes)
  /**
   * Serve the last known-good value when a refresh *fails*, instead of throwing.
   *
   * Without this, a database that is briefly unreachable turns into a 500 from
   * the API and an empty-state page for the visitor, even though a perfectly
   * good answer was sitting in this map moments earlier. `ttlMs`/`swrMs` govern
   * how long data may be served without a *successful* refresh; this governs how
   * long it may be served when refreshing is impossible. Bounded deliberately —
   * past this window, failing loudly is better than showing something ancient.
   */
  staleIfErrorMs?: number;
}

/**
 * Fetch or compute with Stale-While-Revalidate caching
 */
export async function getOrSetCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  const ttlMs = options.ttlMs ?? 30_000; // 30s fresh TTL
  const swrMs = options.swrMs ?? 300_000; // 5min SWR window
  const now = Date.now();

  const entry = memoryCache.get(key);

  if (entry) {
    const age = now - entry.cachedAt;

    // 1. Fresh hit: Return immediately
    if (age < entry.ttlMs) {
      return entry.data;
    }

    // 2. Stale hit (within SWR window): Return stale data immediately, refresh in background
    if (age < entry.ttlMs + entry.swrMs) {
      // Background revalidation without blocking caller
      refreshCache(key, fetcher, ttlMs, swrMs)
        .then(() => undefined)
        .catch((err) => {
          console.warn(`[Cache SWR Refresh Error for key: ${key}]`, err?.message);
        });

      return entry.data;
    }
  }

  // 3. Cache miss or expired beyond SWR: share one synchronous refresh among
  // all concurrent callers. This is important for result pages after a cache
  // expiry, when many visitors may arrive at once.
  const refresh = refreshCache(key, fetcher, ttlMs, swrMs);

  if (options.staleIfErrorMs === undefined) return refresh;

  // A failed refresh leaves the previous entry in place (see refreshCache), so
  // there is something to fall back to. This is what keeps a database hiccup
  // from blanking a page that had rendered correctly a minute ago.
  try {
    return await refresh;
  } catch (error: any) {
    const previous = memoryCache.get(key) as CacheEntry<T> | undefined;
    const age = previous ? now - previous.cachedAt : Infinity;

    if (previous && age <= options.staleIfErrorMs) {
      console.warn(
        `[Cache stale-if-error for key: ${key}] serving ${Math.round(age / 1000)}s-old data: ${error?.message}`
      );
      return previous.data;
    }

    throw error;
  }
}

/**
 * Explicitly invalidate a cache key or pattern
 */
export function invalidateCache(keyOrPrefix?: string) {
  if (!keyOrPrefix) {
    memoryCache.clear();
    return;
  }

  for (const key of memoryCache.keys()) {
    if (key === keyOrPrefix || key.startsWith(keyOrPrefix)) {
      memoryCache.delete(key);
    }
  }
}

/**
 * Inspect cache metrics for observability
 */
export function getCacheStats() {
  const now = Date.now();
  const keys = Array.from(memoryCache.keys());
  const entries = keys.map((k) => {
    const entry = memoryCache.get(k)!;
    const age = now - entry.cachedAt;
    const isFresh = age < entry.ttlMs;
    const isStale = !isFresh && age < entry.ttlMs + entry.swrMs;
    return {
      key: k,
      ageMs: age,
      status: isFresh ? 'FRESH' : isStale ? 'STALE' : 'EXPIRED',
    };
  });

  return {
    totalEntries: memoryCache.size,
    entries,
  };
}
