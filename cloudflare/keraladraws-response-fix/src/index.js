import { brotliDecompressSync } from 'node:zlib';

const cachePolicy = (url, request) => {
  if (request.method !== 'GET' || request.headers.has('authorization')) return null;

  if (url.pathname === '/api/results/today' && !url.search) return { ttl: 10, type: 'api' };
  if (url.pathname === '/api/results/latest') {
    const params = [...url.searchParams.entries()];
    const safeLimit = params.length === 1 && params[0][0] === 'limit' && /^(?:[1-9]|[1-4]\d|50)$/.test(params[0][1]);
    if (!url.search || safeLimit) return { ttl: 15, type: 'api' };
  }
  if (url.search) return null;

  // Only public, read-only result pages are cached. Account, admin, ticket-checker,
  // search, and all other pages continue to go straight to the app Worker.
  if (url.pathname === '/') return { ttl: 60, type: 'html' };
  if (/^\/(?:results|kerala-lottery-result-today|kerala-lottery-result|kerala-lottery-results)(?:\/|$)/.test(url.pathname)) {
    return { ttl: 15, type: 'html' };
  }
  return null;
};

const makeCacheKey = (url, acceptsBrotli) => {
  const keyUrl = new URL(url);
  keyUrl.searchParams.set('__edge_variant', acceptsBrotli ? 'br' : 'identity');
  return new Request(keyUrl.toString(), { method: 'GET' });
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.hostname === 'keraladraws.com') {
      url.hostname = 'www.keraladraws.com';
      return Response.redirect(url.toString(), 308);
    }

    const policy = cachePolicy(url, request);
    const acceptsBrotli = /\bbr\b/i.test(request.headers.get('accept-encoding') || '');
    const cacheKey = policy && makeCacheKey(url, acceptsBrotli);
    if (cacheKey) {
      try {
        const cached = await caches.default.match(cacheKey);
        if (cached) {
          const cachedAt = Number(cached.headers.get('X-KeralaDraws-Cached-At'));
          if (Number.isFinite(cachedAt) && Date.now() - cachedAt < policy.ttl * 1000) {
            const headers = new Headers(cached.headers);
            headers.delete('X-KeralaDraws-Cached-At');
            headers.set('Cache-Control', 'public, max-age=0, must-revalidate');
            headers.set('Cloudflare-CDN-Cache-Control', `public, max-age=${policy.ttl}`);
            headers.set('X-KeralaDraws-Edge-Cache', 'HIT');
            return new Response(cached.body, { status: cached.status, statusText: cached.statusText, headers });
          }
          await caches.default.delete(cacheKey);
        }
      } catch {
        // Cache failures must never take down result pages.
      }
    }

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('accept-encoding', 'identity');
    // These allowlisted pages are public and do not personalize on cookies.
    // Strip them upstream so browser cookies cannot turn public cache entries
    // into user-specific responses or force every visit to requery Postgres.
    if (policy) requestHeaders.delete('cookie');
    const upstreamRequest = new Request(request, { headers: requestHeaders });
    const upstream = await env.UPSTREAM.fetch(upstreamRequest);
    const headers = new Headers(upstream.headers);
    const isHtml = (headers.get('content-type') || '').toLowerCase().includes('text/html');

    let response;
    if (!isHtml) {
      response = new Response(upstream.body, { status: upstream.status, statusText: upstream.statusText, headers });
    } else {
      const body = new Uint8Array(await upstream.arrayBuffer());
      let decoded = body;
      let isBrotli = false;
      try {
        decoded = brotliDecompressSync(body);
        isBrotli = true;
      } catch {
        // Some HTML responses are already uncompressed.
      }

      headers.delete('content-length');
      headers.delete('content-encoding');
      if (isBrotli && acceptsBrotli) {
        headers.set('content-encoding', 'br');
        response = new Response(body, { status: upstream.status, statusText: upstream.statusText, headers });
      } else {
        response = new Response(decoded, { status: upstream.status, statusText: upstream.statusText, headers });
      }
    }

    if (!cacheKey || !policy || ![200, 203].includes(response.status) || response.headers.has('set-cookie')) {
      if (policy) response.headers.set('X-KeralaDraws-Edge-Cache', 'BYPASS');
      return response;
    }

    const cacheHeaders = new Headers(response.headers);
    cacheHeaders.delete('set-cookie');
    cacheHeaders.set('Cache-Control', `public, max-age=${policy.ttl}`);
    cacheHeaders.set('X-KeralaDraws-Cached-At', String(Date.now()));
    cacheHeaders.set('X-KeralaDraws-Edge-Cache', 'MISS');
    response.headers.set('Cache-Control', 'public, max-age=0, must-revalidate');
    response.headers.set('Cloudflare-CDN-Cache-Control', `public, max-age=${policy.ttl}`);
    response.headers.set('X-KeralaDraws-Edge-Cache', 'MISS');
    const cacheableResponse = new Response(response.clone().body, {
      status: response.status,
      statusText: response.statusText,
      headers: cacheHeaders,
    });
    ctx.waitUntil(caches.default.put(cacheKey, cacheableResponse).catch(() => {}));
    return response;
  },
};
