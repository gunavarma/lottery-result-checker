import { defineMiddleware } from 'astro:middleware';
import { promisify } from 'node:util';
import { gzip as gzipCb, brotliCompress as brotliCb, constants } from 'node:zlib';
import { startBackgroundScheduler } from '@/lib/scheduler';

const gzip = promisify(gzipCb);
const brotli = promisify(brotliCb);

/**
 * Compression middleware for the @astrojs/node adapter.
 *
 * Vercel (the production host) automatically handles gzip/brotli via its CDN,
 * so this middleware exists primarily to give accurate Lighthouse scores when
 * running `node dist/server/entry.mjs` locally. On Vercel builds the adapter
 * is swapped to @astrojs/vercel and this middleware is a harmless pass-through
 * because Vercel already compresses the response before it hits the browser.
 *
 * Only text-based responses (HTML, CSS, JS, JSON, SVG, XML) over 1 KB are
 * compressed. Binary assets (images, fonts, wasm) are left untouched.
 */
const COMPRESSIBLE = /^(text\/|application\/(json|javascript|xml|xhtml|x-javascript)|image\/svg)/;
const MIN_SIZE = 1024; // bytes — below this, compression overhead exceeds savings

export const onRequest = defineMiddleware(async (_ctx, next) => {
  // Idempotent (guarded by a global flag) and a no-op on serverless hosts, so
  // the only cost per request is one property read. See `lib/scheduler.ts` for
  // why this hook and not a boot hook: middleware is the one place that runs in
  // every adapter, including the standalone Node server.
  startBackgroundScheduler();

  const response = await next();

  // Don't compress if the response already has a Content-Encoding header
  // (e.g. from Vercel's CDN or an upstream proxy).
  if (response.headers.get('content-encoding')) {
    return response;
  }

  const contentType = response.headers.get('content-type') || '';
  if (!COMPRESSIBLE.test(contentType)) {
    return response;
  }

  const body = await response.arrayBuffer();
  if (body.byteLength < MIN_SIZE) {
    return new Response(body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  }

  const accept = _ctx.request.headers.get('accept-encoding') || '';
  let compressed: Buffer;
  let encoding: string;

  if (accept.includes('br')) {
    compressed = await brotli(Buffer.from(body), {
      params: { [constants.BROTLI_PARAM_QUALITY]: 4 }, // fast compression
    });
    encoding = 'br';
  } else if (accept.includes('gzip')) {
    compressed = await gzip(Buffer.from(body), { level: 6 });
    encoding = 'gzip';
  } else {
    return new Response(body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  }

  const headers = new Headers(response.headers);
  headers.set('content-encoding', encoding);
  headers.set('content-length', String(compressed.byteLength));
  headers.set('vary', 'Accept-Encoding');

  // `compressed` is a Node Buffer; copying it into a plain Uint8Array keeps it
  // assignable to `BodyInit` under the newer generic `ArrayBufferLike` typings.
  return new Response(new Uint8Array(compressed), {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
});
