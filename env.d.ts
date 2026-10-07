/// <reference types="astro/client" />
/// <reference types="@astrojs/vercel/client" />

/**
 * Public (browser-visible) environment variables.
 *
 * Astro only inlines `PUBLIC_`-prefixed variables into client code, and only
 * these two are read by the document layout. Declaring them here means a typo
 * in the GA variable name is a type error during `astro check` rather than a
 * silently untracked site:
 *
 *   - `PUBLIC_GA_MEASUREMENT_ID` — the GA4 web-stream measurement ID (`G-…`).
 *     Preferred name since the Next.js → Astro migration.
 *   - `PUBLIC_GA_ID` — the older name, still honoured so an existing
 *     deployment's configuration keeps working.
 *
 * Neither is a secret; the measurement ID is visible in every page's HTML.
 */
interface ImportMetaEnv {
  readonly PUBLIC_GA_MEASUREMENT_ID?: string;
  readonly PUBLIC_GA_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
