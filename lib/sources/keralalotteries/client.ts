import { fetchText } from '../http';
import { getTodayIstStr } from '../../date';

/**
 * Discovery + fetching for keralalotteries.net (unofficial live aggregator).
 *
 * The per-draw page URL is published before the draw takes place, so discovery
 * is a cheap lookup and the actual polling target is the stable draw page
 * itself. Known URL shape:
 *   /YYYY/MM/{scheme}-kerala-lottery-result-{code}-{n}-today-DD-MM-YYYY.html
 */

export const KERALALOTTERIES_BASE_URL = (
  process.env.KERALALOTTERIES_BASE_URL || 'https://www.keralalotteries.net'
).replace(/\/+$/, '');

/** Stable live hub page (used for discovery fallback and attribution). */
export const KERALALOTTERIES_LIVE_HUB_URL = `${KERALALOTTERIES_BASE_URL}/2018/02/today-kerala-lottery-result-live.html`;

export function isAggregatorEnabled(): boolean {
  return (process.env.KERALALOTTERIES_ENABLED ?? 'true').toLowerCase() !== 'false';
}

export interface DrawPageRef {
  url: string;
  dateStr: string; // YYYY-MM-DD
  code: string; // e.g. SM
  drawNumber: string; // e.g. SM-72
}

const DRAW_PAGE_PATH =
  /\/(\d{4})\/(\d{2})\/[a-z0-9-]+-kerala-lottery-result-([a-z]{2})-(\d{1,4})-today-(\d{2})-(\d{2})-(\d{4})\.html/i;

/** Extracts every candidate URL from anchors, <loc> entries and raw text. */
export function extractCandidateUrls(html: string): string[] {
  const found = new Set<string>();

  for (const match of html.matchAll(/href\s*=\s*["']([^"']+)["']/gi)) {
    found.add(match[1]);
  }
  for (const match of html.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)) {
    found.add(match[1]);
  }
  for (const match of html.matchAll(/https?:\/\/[^\s"'<>]+?\.html/gi)) {
    found.add(match[0]);
  }

  return Array.from(found);
}

export function toDrawPageRef(candidate: string): DrawPageRef | null {
  const path = candidate.startsWith('http')
    ? candidate
    : `${KERALALOTTERIES_BASE_URL}${candidate.startsWith('/') ? '' : '/'}${candidate}`;

  const match = path.match(DRAW_PAGE_PATH);
  if (!match) return null;

  const [, , , code, number, day, month, year] = match;
  const codeUpper = code.toUpperCase();

  return {
    url: path.split(/[?#]/)[0],
    dateStr: `${year}-${month}-${day}`,
    code: codeUpper,
    drawNumber: `${codeUpper}-${number}`,
  };
}

export function parseDrawPageRefs(html: string): DrawPageRef[] {
  const refs = new Map<string, DrawPageRef>();

  for (const candidate of extractCandidateUrls(html)) {
    const ref = toDrawPageRef(candidate);
    if (ref) refs.set(ref.url, ref);
  }

  return Array.from(refs.values());
}

/** Process-local discovery cache. Purely an optimisation — the DB is truth. */
const discoveryCache = new Map<string, { ref: DrawPageRef | null; cachedAt: number }>();
const DISCOVERY_TTL_MS = 10 * 60 * 1000;

function readCachedRef(dateStr: string): DrawPageRef | null | undefined {
  const entry = discoveryCache.get(dateStr);
  if (!entry) return undefined;
  if (Date.now() - entry.cachedAt > DISCOVERY_TTL_MS) {
    discoveryCache.delete(dateStr);
    return undefined;
  }
  return entry.ref;
}

/**
 * Finds the draw page for a given IST date.
 *
 * Discovery order: the sitemap index (newest first, and the per-draw URL is
 * created ahead of the draw), then the live hub as a fallback.
 */
export async function discoverDrawPageForDate(
  dateStr: string = getTodayIstStr()
): Promise<DrawPageRef | null> {
  const cached = readCachedRef(dateStr);
  if (cached !== undefined) return cached;

  const sitemapCandidates = await collectSitemapUrls();

  for (const url of sitemapCandidates) {
    const ref = toDrawPageRef(url);
    if (ref && ref.dateStr === dateStr) {
      discoveryCache.set(dateStr, { ref, cachedAt: Date.now() });
      return ref;
    }
  }

  const hub = await fetchText(KERALALOTTERIES_LIVE_HUB_URL, { attempts: 2, timeoutMs: 12_000 });
  if (hub.ok && !hub.notModified) {
    const ref = parseDrawPageRefs(hub.text).find((candidate) => candidate.dateStr === dateStr) ?? null;
    discoveryCache.set(dateStr, { ref, cachedAt: Date.now() });
    return ref;
  }

  // Do not cache a negative result caused by a network problem.
  return null;
}

async function collectSitemapUrls(): Promise<string[]> {
  const indexUrl = `${KERALALOTTERIES_BASE_URL}/sitemap.xml`;
  const index = await fetchText(indexUrl, { attempts: 2, timeoutMs: 12_000 });
  if (!index.ok) return [];

  const childSitemaps = Array.from(index.text.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)).map(
    (match) => match[1]
  );

  const targets = childSitemaps.length > 0 ? childSitemaps.slice(0, 3) : [indexUrl];
  const results = await Promise.all(
    targets.map((url) => fetchText(url, { attempts: 2, timeoutMs: 12_000 }))
  );

  const urls: string[] = [];
  for (const result of results) {
    if (result.ok && result.text) {
      urls.push(...extractCandidateUrls(result.text));
    }
  }

  return urls;
}

export interface DrawPageContent {
  ref: DrawPageRef;
  html: string;
  etag: string | null;
  lastModified: string | null;
}

export async function fetchDrawPage(ref: DrawPageRef): Promise<DrawPageContent | null> {
  const res = await fetchText(ref.url, { attempts: 2, timeoutMs: 12_000 });
  if (!res.ok || !res.text) return null;

  return { ref, html: res.text, etag: res.etag, lastModified: res.lastModified };
}

export function resetDiscoveryCache() {
  discoveryCache.clear();
}
