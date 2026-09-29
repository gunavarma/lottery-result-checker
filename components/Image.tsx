import React from 'react';

/**
 * Astro-native replacement for `next/image`.
 *
 * Next.js's `<Image>` wrapped every image in its own resizing/optimising
 * pipeline. Astro's equivalent is the `<Image />` component from `astro:assets`,
 * which is compile-time and can only be used from `.astro` files — it cannot
 * back a React island, and the images here (`/logo.svg`, `/icon-192.png`) are
 * already hand-sized brand assets that gain nothing from resizing.
 *
 * So this renders a plain `<img>` while preserving the two behaviours that
 * actually mattered at the call sites:
 *   - `priority` becomes `fetchPriority="high"` + eager loading, so the navbar
 *     and footer logos are not lazy-loaded behind the fold.
 *   - `fill` reproduces Next's absolute-positioned, object-fit wrapper styles.
 *
 * Every other Next-only prop is accepted and ignored so the components ported
 * without touching their JSX.
 *
 * NOTE: `next/image`'s `src` may be a static import object; all current call
 * sites pass a string path.
 */
export interface ImageProps
  extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src' | 'width' | 'height'> {
  src: string;
  alt: string;
  width?: number | string;
  height?: number | string;
  /** Next.js-only. Maps to eager loading + high fetch priority. */
  priority?: boolean;
  /** Next.js-only. Maps to the absolute-positioned fill layout. */
  fill?: boolean;
  /** Next.js-only. Ignored. */
  quality?: number | string;
  /** Next.js-only. Ignored. */
  placeholder?: string;
  /** Next.js-only. Ignored. */
  blurDataURL?: string;
  /** Next.js-only. Ignored. */
  unoptimized?: boolean;
  /** Next.js-only. Ignored: no remote loader is configured. */
  loader?: unknown;
  /** Next.js-only. Ignored. */
  sizes?: string;
  /** Applied to the fill layout; ignored when width/height are used. */
  objectFit?: React.CSSProperties['objectFit'];
}

export function Image({
  src,
  alt,
  width,
  height,
  priority = false,
  fill = false,
  quality: _quality,
  placeholder: _placeholder,
  blurDataURL: _blurDataURL,
  unoptimized: _unoptimized,
  loader: _loader,
  sizes: _sizes,
  objectFit,
  style,
  loading,
  fetchPriority,
  ...imgProps
}: ImageProps) {
  // `fill` reproduces Next.js's absolute-positioned, object-fit image layout.
  // `objectFit` is destructured out so it is not forwarded to the DOM, where it
  // is not a valid attribute (the CSS property lives in `style`).
  const resolvedStyle: React.CSSProperties = fill
    ? {
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        objectFit: objectFit ?? 'cover',
        ...style,
      }
    : (style ?? {});

  return (
    <img
      src={src}
      alt={alt}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      // `priority` images are above the fold; everything else defers.
      loading={loading ?? (priority ? 'eager' : 'lazy')}
      fetchPriority={fetchPriority ?? (priority ? 'high' : undefined)}
      decoding={priority ? 'sync' : 'async'}
      style={resolvedStyle}
      {...imgProps}
    />
  );
}

export default Image;
