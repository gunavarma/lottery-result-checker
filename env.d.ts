/// <reference types="astro/client" />
/// <reference types="@astrojs/vercel/client" />

/**
 * Public (browser-visible) environment variables.
 *
 * Astro inlines public variables at build time, so a typo in one of these names
 * is a silent misconfiguration at runtime. Declaring them here turns that into a
 * type error during `astro check`.
 *
 * Both prefixes are declared: `PUBLIC_` is Astro's own, and `NEXT_PUBLIC_` is
 * still read so an existing deployment keeps working — see `vite.envPrefix` in
 * `astro.config.ts`. None of these are secrets; every one of them ends up in
 * the page's HTML or JavaScript.
 *
 * `lib/public-env.ts` is the single place that reads them.
 */
interface ImportMetaEnv {
  // --- Google Analytics 4 -------------------------------------------------
  /** GA4 web-stream measurement ID (`G-…`). Preferred name. */
  readonly PUBLIC_GA_MEASUREMENT_ID?: string;
  /** Older name for the same value, still honoured. */
  readonly PUBLIC_GA_ID?: string;

  // --- Firebase Cloud Messaging (web push) --------------------------------
  readonly PUBLIC_FIREBASE_API_KEY?: string;
  readonly PUBLIC_FIREBASE_AUTH_DOMAIN?: string;
  readonly PUBLIC_FIREBASE_PROJECT_ID?: string;
  readonly PUBLIC_FIREBASE_STORAGE_BUCKET?: string;
  readonly PUBLIC_FIREBASE_MESSAGING_SENDER_ID?: string;
  readonly PUBLIC_FIREBASE_APP_ID?: string;
  readonly PUBLIC_FIREBASE_VAPID_KEY?: string;

  // --- Web Push (VAPID) ---------------------------------------------------
  readonly PUBLIC_VAPID_PUBLIC_KEY?: string;

  // --- Legacy Next.js names, read for backwards compatibility -------------
  readonly NEXT_PUBLIC_FIREBASE_API_KEY?: string;
  readonly NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?: string;
  readonly NEXT_PUBLIC_FIREBASE_PROJECT_ID?: string;
  readonly NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?: string;
  readonly NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?: string;
  readonly NEXT_PUBLIC_FIREBASE_APP_ID?: string;
  readonly NEXT_PUBLIC_FIREBASE_VAPID_KEY?: string;
  readonly NEXT_PUBLIC_VAPID_PUBLIC_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
