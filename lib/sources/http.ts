/**
 * Polite HTTP client for external result sources.
 *
 * We crawl third-party sites (and the official portal) in the background, so
 * the fetcher is deliberately conservative: it identifies itself, times out,
 * retries with backoff only on transient failures, and supports conditional
 * GETs so an unchanged document costs the origin a 304 instead of a full body.
 */

export const BOT_USER_AGENT =
  'KeralaDrawsBot/1.0 (+https://keraladraws.com; automated lottery result aggregation; contact: admin@keraladraws.com)';

const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_ATTEMPTS = 3;

export interface FetchTextOptions {
  timeoutMs?: number;
  attempts?: number;
  headers?: Record<string, string>;
  /** Conditional GET: skip the body when the resource has not changed. */
  etag?: string | null;
  lastModified?: string | null;
  accept?: string;
}

export interface FetchTextResult {
  ok: boolean;
  status: number;
  notModified: boolean;
  text: string;
  etag: string | null;
  lastModified: string | null;
  error?: string;
}

function isRetryable(status: number): boolean {
  return status === 408 || status === 425 || status === 429 || status >= 500;
}

/**
 * Fetches a document as text with timeout, retry/backoff and conditional GET.
 * Never throws: callers receive an `ok: false` result with a reason, so a
 * source outage can be logged and skipped without taking down the pipeline.
 */
export async function fetchText(
  url: string,
  options: FetchTextOptions = {}
): Promise<FetchTextResult> {
  const attempts = Math.max(1, options.attempts ?? DEFAULT_ATTEMPTS);
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  const headers: Record<string, string> = {
    'User-Agent': BOT_USER_AGENT,
    Accept: options.accept ?? 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-IN,en;q=0.9',
    ...options.headers,
  };

  if (options.etag) headers['If-None-Match'] = options.etag;
  if (options.lastModified) headers['If-Modified-Since'] = options.lastModified;

  let lastError = 'unknown error';

  for (let attempt = 1; attempt <= attempts; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(url, {
        headers,
        signal: controller.signal,
        cache: 'no-store',
        redirect: 'follow',
      });

      clearTimeout(timer);

      if (res.status === 304) {
        return {
          ok: true,
          status: 304,
          notModified: true,
          text: '',
          etag: res.headers.get('etag'),
          lastModified: res.headers.get('last-modified'),
        };
      }

      if (!res.ok) {
        if (isRetryable(res.status) && attempt < attempts) {
          lastError = `HTTP ${res.status}`;
          await backoff(attempt);
          continue;
        }

        return {
          ok: false,
          status: res.status,
          notModified: false,
          text: '',
          etag: null,
          lastModified: null,
          error: `HTTP ${res.status}`,
        };
      }

      return {
        ok: true,
        status: res.status,
        notModified: false,
        text: await res.text(),
        etag: res.headers.get('etag'),
        lastModified: res.headers.get('last-modified'),
      };
    } catch (error: any) {
      clearTimeout(timer);
      lastError = error?.name === 'AbortError' ? `timeout after ${timeoutMs}ms` : (error?.message || String(error));

      if (attempt < attempts) {
        await backoff(attempt);
        continue;
      }
    }
  }

  return {
    ok: false,
    status: 0,
    notModified: false,
    text: '',
    etag: null,
    lastModified: null,
    error: lastError,
  };
}

function backoff(attempt: number): Promise<void> {
  const delay = Math.min(4000, 500 * 2 ** (attempt - 1));
  return new Promise((resolve) => setTimeout(resolve, delay));
}
