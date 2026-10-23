/**
 * Is this process running a production build?
 *
 * `process.env.NODE_ENV` alone is not a reliable answer, and the gap was
 * exploitable: the built bundle — the artifact `node server.mjs` serves — is a
 * production build even when `NODE_ENV` was never exported. Starting it that
 * way silently re-enabled the development conveniences that are supposed to be
 * unreachable outside `astro dev`:
 *
 *  - the admin panel accepted the documented `admin` / `admin` fallback when
 *    no `ADMIN_PASSWORD` was configured, and
 *  - the cron/automation endpoints ran without a secret.
 *
 * Both are "never reachable in production" guarantees in the code and in the
 * README, and both were reachable through the production entry point.
 *
 * `import.meta.env.PROD` is inlined by Vite at build time, so the rule follows
 * the *artifact* rather than the way it happened to be started. `astro dev`
 * builds with `PROD === false`, so local development keeps its conveniences.
 */
export const IS_PRODUCTION_BUILD =
  process.env.NODE_ENV === 'production' || import.meta.env.PROD;
