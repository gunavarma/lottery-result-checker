//#region lib/cache.ts
/**
* Successfully published results are immutable — a stored draw never changes —
* so during a database outage the last good copy is still *correct*, just not
* newest. Half an hour is generous enough to ride out pooler exhaustion and
* short enough that a genuinely stale page cannot persist.
*/
var PUBLISHED_DATA_STALE_IF_ERROR_MS = 18e5;
/**
* Today's snapshot and the live state machine change through the day, so their
* last-good copy is served for a shorter window before failing loudly.
*/
var LIVE_DATA_STALE_IF_ERROR_MS = 9e5;
var memoryCache = /* @__PURE__ */ new Map();
var inFlightFetches = /* @__PURE__ */ new Map();
function refreshCache(key, fetcher, ttlMs, swrMs) {
	const activeFetch = inFlightFetches.get(key);
	if (activeFetch) return activeFetch;
	const refresh = fetcher().then((freshData) => {
		memoryCache.set(key, {
			data: freshData,
			cachedAt: Date.now(),
			ttlMs,
			swrMs
		});
		return freshData;
	}).finally(() => inFlightFetches.delete(key));
	inFlightFetches.set(key, refresh);
	return refresh;
}
/**
* Fetch or compute with Stale-While-Revalidate caching
*/
async function getOrSetCache(key, fetcher, options = {}) {
	const ttlMs = options.ttlMs ?? 3e4;
	const swrMs = options.swrMs ?? 3e5;
	const now = Date.now();
	const entry = memoryCache.get(key);
	if (entry) {
		const age = now - entry.cachedAt;
		if (age < entry.ttlMs) return entry.data;
		if (age < entry.ttlMs + entry.swrMs) {
			refreshCache(key, fetcher, ttlMs, swrMs).then(() => void 0).catch((err) => {
				console.warn(`[Cache SWR Refresh Error for key: ${key}]`, err?.message);
			});
			return entry.data;
		}
	}
	const refresh = refreshCache(key, fetcher, ttlMs, swrMs);
	if (options.staleIfErrorMs === void 0) return refresh;
	try {
		return await refresh;
	} catch (error) {
		const previous = memoryCache.get(key);
		const age = previous ? now - previous.cachedAt : Infinity;
		if (previous && age <= options.staleIfErrorMs) {
			console.warn(`[Cache stale-if-error for key: ${key}] serving ${Math.round(age / 1e3)}s-old data: ${error?.message}`);
			return previous.data;
		}
		throw error;
	}
}
/**
* Explicitly invalidate a cache key or pattern
*/
function invalidateCache(keyOrPrefix) {
	if (!keyOrPrefix) {
		memoryCache.clear();
		return;
	}
	for (const key of memoryCache.keys()) if (key === keyOrPrefix || key.startsWith(keyOrPrefix)) memoryCache.delete(key);
}
//#endregion
export { invalidateCache as i, PUBLISHED_DATA_STALE_IF_ERROR_MS as n, getOrSetCache as r, LIVE_DATA_STALE_IF_ERROR_MS as t };
