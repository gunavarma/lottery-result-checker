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

const memoryCache = new Map<string, CacheEntry<any>>();

export interface CacheOptions {
  ttlMs?: number; // Time in ms before considered stale (default: 30 seconds)
  swrMs?: number; // Time in ms data can be served stale while refreshing in background (default: 5 minutes)
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
      fetcher()
        .then((freshData) => {
          memoryCache.set(key, {
            data: freshData,
            cachedAt: Date.now(),
            ttlMs,
            swrMs,
          });
        })
        .catch((err) => {
          console.warn(`[Cache SWR Refresh Error for key: ${key}]`, err?.message);
        });

      return entry.data;
    }
  }

  // 3. Cache miss or expired beyond SWR: Fetch fresh synchronously
  const freshData = await fetcher();
  memoryCache.set(key, {
    data: freshData,
    cachedAt: Date.now(),
    ttlMs,
    swrMs,
  });

  return freshData;
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
