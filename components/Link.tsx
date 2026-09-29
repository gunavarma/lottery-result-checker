import React from 'react';

/**
 * Astro-native replacement for `next/link`.
 *
 * Astro navigates with real, full-page requests (there is no client-side router
 * in the default, non-view-transition setup), so the correct rendering of an
 * internal link is a plain `<a href>`. Next.js's `<Link>` only existed to hook
 * into its client-side prefetch/push machinery, which no longer exists.
 *
 * The Next-only props are accepted and intentionally ignored rather than being
 * deleted from ~40 call sites: keeping them is what let each component port as a
 * one-line import change, and it keeps the diff reviewable. They are typed as
 * optional so a stray `prefetch` or `replace` is a no-op instead of a crash.
 *
 * Relative hrefs are passed through untouched, exactly as Next.js emitted them,
 * so every existing internal URL keeps working.
 */
export interface LinkProps
  extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  href: string;
  /** Next.js-only. Ignored: there is no client-side prefetch cache. */
  prefetch?: boolean;
  /** Next.js-only. Ignored: a plain anchor always replaces the history entry's target. */
  replace?: boolean;
  /** Next.js-only. Ignored: the browser's default scroll behaviour applies. */
  scroll?: boolean;
  /** Next.js-only. Ignored: the locale is part of the href in Astro. */
  locale?: string | false;
  /** Next.js-only. Ignored. */
  legacyBehavior?: boolean;
  /** Next.js-only. Ignored. */
  passHref?: boolean;
  /** Next.js-only. Ignored. */
  shallow?: boolean;
}

export function Link({
  href,
  prefetch: _prefetch,
  replace: _replace,
  scroll: _scroll,
  locale: _locale,
  legacyBehavior: _legacyBehavior,
  passHref: _passHref,
  shallow: _shallow,
  ...anchorProps
}: LinkProps) {
  return <a href={href} {...anchorProps} />;
}

export default Link;
