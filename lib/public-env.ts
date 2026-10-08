/**
 * Public (browser-visible) environment variables, in one place.
 *
 * Two reasons this exists rather than reading `import.meta.env` at each call
 * site:
 *
 *  1. Astro inlines public variables at *build* time and only for the prefix it
 *     has been configured to expose (`PUBLIC_`). The `NEXT_PUBLIC_` names the
 *     deployment has used for years are still accepted — see `vite.envPrefix` in
 *     `astro.config.ts` — so an existing Vercel project keeps working without
 *     re-entering any value.
 *  2. `process.env.X` does not exist in the browser. Code that read it there
 *     silently fell back to its placeholder value, which is exactly how the
 *     Firebase config was shipping dummy credentials to every visitor.
 *
 * These are the literal accesses Vite statically replaces; they must not be
 * refactored into a computed lookup.
 */

function pick(...values: Array<string | undefined>): string | undefined {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) return trimmed;
  }
  return undefined;
}

export const FIREBASE_API_KEY = pick(
  import.meta.env.PUBLIC_FIREBASE_API_KEY,
  import.meta.env.NEXT_PUBLIC_FIREBASE_API_KEY
);

export const FIREBASE_AUTH_DOMAIN = pick(
  import.meta.env.PUBLIC_FIREBASE_AUTH_DOMAIN,
  import.meta.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
);

export const FIREBASE_PROJECT_ID = pick(
  import.meta.env.PUBLIC_FIREBASE_PROJECT_ID,
  import.meta.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
);

export const FIREBASE_STORAGE_BUCKET = pick(
  import.meta.env.PUBLIC_FIREBASE_STORAGE_BUCKET,
  import.meta.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
);

export const FIREBASE_MESSAGING_SENDER_ID = pick(
  import.meta.env.PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  import.meta.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
);

export const FIREBASE_APP_ID = pick(
  import.meta.env.PUBLIC_FIREBASE_APP_ID,
  import.meta.env.NEXT_PUBLIC_FIREBASE_APP_ID
);

/** Web Push VAPID public key. Firebase's own name wins when both are set. */
export const VAPID_PUBLIC_KEY = pick(
  import.meta.env.PUBLIC_FIREBASE_VAPID_KEY,
  import.meta.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
  import.meta.env.PUBLIC_VAPID_PUBLIC_KEY,
  import.meta.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
);
