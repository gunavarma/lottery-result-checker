// Node and Vercel builds do not provide Cloudflare bindings. This shim is used
// only outside the Cloudflare Workers build by the alias in astro.config.ts.
export const env = {};
