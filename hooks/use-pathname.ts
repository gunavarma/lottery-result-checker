import { useEffect, useState } from 'react';

/**
 * Current browser path, for islands that have no path prop.
 *
 * Astro has no client-side router, so there is no route state to subscribe to:
 * `window.location` is the only source of truth and every internal link is a
 * real document request. The value is read in an effect rather than during
 * render so the server render and the first client render agree — reading
 * `window.location` while rendering would produce different markup on each side
 * and hydrate-mismatch every island that used it.
 *
 * Prefer passing the pathname in from the Astro route: `Astro.url.pathname`
 * already knows it, which keeps the server-rendered HTML correct before any
 * JavaScript runs (the navbar does exactly that, as a fallback only).
 */
export function usePathname(): string {
  const [pathname, setPathname] = useState('');

  useEffect(() => {
    setPathname(window.location.pathname);
  }, []);

  return pathname;
}
