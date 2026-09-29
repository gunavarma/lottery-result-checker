'use client';

import { useEffect, useState } from 'react';

/**
 * Navigation hooks replacing `next/navigation`'s client hooks.
 *
 * Astro has no client-side router: every internal link is a real document
 * request, so there is no SPA route state to subscribe to. `window.location` is
 * the source of truth, and the only reason these are hooks at all is that the
 * value must not be read during SSR.
 *
 * `usePathname` deliberately returns `''` on the server and for the first client
 * render, then fills in the real path from an effect. Reading `window.location`
 * directly during render would produce different markup on the server and the
 * client and trigger a hydration mismatch in every island that uses it.
 *
 * Consumers that need the active state correct in the *server* HTML (the navbar)
 * should take a `pathname` prop from the page instead, and it will win over this
 * fallback — Astro already knows the request path.
 */
export function usePathname(): string {
  const [pathname, setPathname] = useState('');

  useEffect(() => {
    setPathname(window.location.pathname);
  }, []);

  return pathname;
}

export interface AstroRouter {
  push: (href: string) => void;
  replace: (href: string) => void;
  back: () => void;
  forward: () => void;
  refresh: () => void;
  prefetch: (href: string) => void;
}

/**
 * Mirrors the slice of Next's `useRouter` the app actually used. Every method
 * maps onto a browser navigation primitive, because Astro renders full pages.
 */
export function useRouter(): AstroRouter {
  return {
    push: (href: string) => {
      window.location.assign(href);
    },
    replace: (href: string) => {
      window.location.replace(href);
    },
    back: () => window.history.back(),
    forward: () => window.history.forward(),
    // Next's `router.refresh()` re-fetched server components in place. With
    // full-page rendering the equivalent is reloading the document, which
    // re-runs the server render and revalidates the TanStack Query cache.
    refresh: () => window.location.reload(),
    // Nothing to do: an anchor navigates on click, so there is no route bundle
    // to warm ahead of time.
    prefetch: () => {},
  };
}
