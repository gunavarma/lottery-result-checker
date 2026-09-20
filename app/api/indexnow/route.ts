import { NextRequest, NextResponse } from 'next/server';
import { SITE_URL } from '@/lib/seo';
import { denyUnauthorizedAny } from '@/lib/security/auth';

export const dynamic = 'force-dynamic';

const INDEXNOW_KEY = '67f813276f088603b0621b306e7bcfb9';
const INDEXNOW_HOST = 'api.indexnow.org';

// POST /api/indexnow  { urls: string[] }
// Authenticated (cron/admin secret) ping to IndexNow so Bing picks up new or
// updated result pages quickly — Bing's index feeds several AI answer engines.
// Accepts absolute URLs or site paths (/kerala-lottery-result/2026-09-12).
export async function POST(request: NextRequest) {
  const unauthorized = denyUnauthorizedAny(request, ['cron', 'admin']);
  if (unauthorized) return unauthorized;

  let urls: unknown;
  try {
    const body = await request.json();
    urls = body?.urls;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!Array.isArray(urls) || urls.length === 0 || urls.length > 100) {
    return NextResponse.json(
      { error: 'Body must contain a urls array of 1-100 entries' },
      { status: 400 }
    );
  }

  // Normalize paths to absolute URLs on our host and drop foreign hosts.
  const normalized = urls
    .map((u) => {
      if (typeof u !== 'string' || !u) return null;
      try {
        const abs = u.startsWith('/') ? `${SITE_URL}${u}` : u;
        const parsed = new URL(abs);
        if (parsed.host !== new URL(SITE_URL).host) return null;
        return parsed.toString();
      } catch {
        return null;
      }
    })
    .filter((u): u is string => !!u);

  if (normalized.length === 0) {
    return NextResponse.json({ error: 'No valid URLs for this host' }, { status: 400 });
  }

  try {
    const res = await fetch(`https://${INDEXNOW_HOST}/IndexNow`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host: new URL(SITE_URL).host,
        key: INDEXNOW_KEY,
        keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
        urlList: normalized,
      }),
      // Best-effort: never let a slow ping block the caller.
      signal: AbortSignal.timeout(8000),
    });

    return NextResponse.json(
      {
        submitted: normalized.length,
        indexNowStatus: res.status,
        ok: res.ok || res.status === 202 || res.status === 200,
      },
      { status: res.ok || res.status === 202 ? 200 : 502 }
    );
  } catch (error) {
    console.error('[IndexNow] ping failed:', error);
    // Not fatal for the sync pipeline; surface as accepted-with-warning.
    return NextResponse.json(
      { submitted: normalized.length, indexNowStatus: 'unreachable', ok: false },
      { status: 202 }
    );
  }
}
