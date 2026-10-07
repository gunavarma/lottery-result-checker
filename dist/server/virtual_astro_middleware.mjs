import { lt as defineMiddleware, t as sequence } from "./chunks/sequence_BPLPtIhF.mjs";
import { promisify } from "node:util";
import { brotliCompress, constants, gzip } from "node:zlib";
//#region astro/middleware.ts
var gzip$1 = promisify(gzip);
var brotli = promisify(brotliCompress);
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
var COMPRESSIBLE = /^(text\/|application\/(json|javascript|xml|xhtml|x-javascript)|image\/svg)/;
var MIN_SIZE = 1024;
var onRequest$1 = defineMiddleware(async (_ctx, next) => {
	const response = await next();
	if (response.headers.get("content-encoding")) return response;
	const contentType = response.headers.get("content-type") || "";
	if (!COMPRESSIBLE.test(contentType)) return response;
	const body = await response.arrayBuffer();
	if (body.byteLength < MIN_SIZE) return new Response(body, {
		status: response.status,
		statusText: response.statusText,
		headers: response.headers
	});
	const accept = _ctx.request.headers.get("accept-encoding") || "";
	let compressed;
	let encoding;
	if (accept.includes("br")) {
		compressed = await brotli(Buffer.from(body), { params: { [constants.BROTLI_PARAM_QUALITY]: 4 } });
		encoding = "br";
	} else if (accept.includes("gzip")) {
		compressed = await gzip$1(Buffer.from(body), { level: 6 });
		encoding = "gzip";
	} else return new Response(body, {
		status: response.status,
		statusText: response.statusText,
		headers: response.headers
	});
	const headers = new Headers(response.headers);
	headers.set("content-encoding", encoding);
	headers.set("content-length", String(compressed.byteLength));
	headers.set("vary", "Accept-Encoding");
	return new Response(new Uint8Array(compressed), {
		status: response.status,
		statusText: response.statusText,
		headers
	});
});
//#endregion
//#region \0virtual:astro:middleware
var onRequest = sequence(onRequest$1);
//#endregion
export { onRequest };
