import React from 'react';

/**
 * Astro-native replacement for `next/link`.
 *
 * Astro renders standard, crawlable anchors. Its small built-in prefetch
 * runtime can warm a document before navigation, so result-detail links are
 * fetched on user intent (hover/focus/tap). This preserves normal browser
 * navigation while removing the wait after “View result”.
 *
 * The Next-only props are accepted and intentionally ignored rather than being
 * deleted from ~40 call sites: keeping them is what let each component port as a
 * one-line import change, and it keeps the diff reviewable. They are typed as
 * optional so a stray `replace` is a no-op instead of a crash.
 *
 * Relative hrefs are passed through untouched, exactly as Next.js emitted them,
 * so every existing internal URL keeps working.
 */
export interface LinkProps
  extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  href: string;
  /** Set false to opt out of intent prefetching for a result-detail link. */
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
  prefetch = true,
  replace: _replace,
  scroll: _scroll,
  locale: _locale,
  legacyBehavior: _legacyBehavior,
  passHref: _passHref,
  shallow: _shallow,
  ...anchorProps
}: LinkProps) {
  // Do not prefetch directory/list pages: a grid can contain many links and
  // eagerly fetching all of them would recreate the Supabase egress spike.
  // A single full-result document is small in the browser cache and is exactly
  // the destination a visitor has indicated they want to open.
  const isResultDetail =
    href.startsWith('/kerala-lottery-result/') || href.startsWith('/results/');
  const astroPrefetch = prefetch && isResultDetail ? 'hover' : undefined;

  return <a href={href} data-astro-prefetch={astroPrefetch} {...anchorProps} />;
}

export default Link;
