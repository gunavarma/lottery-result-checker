/**
 * Name of the cookie that remembers an explicit language choice.
 *
 * Lives in its own module with no imports on purpose: `lib/i18n/config.ts`
 * resolves `SITE_URL` from server-only environment variables, so a client
 * component cannot import it without pulling `process.env` into the browser
 * bundle. Both the server (`lib/i18n/config.ts` re-exports this) and the client
 * (`context/LanguageContext.tsx`) read the same constant, which is what keeps
 * the value written and the value read from drifting apart — they had already
 * diverged once and the stored preference was never read back.
 */
export const LOCALE_COOKIE = 'keraladraws_locale';
