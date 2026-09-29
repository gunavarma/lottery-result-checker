/**
 * Framework-agnostic description of everything KeralaDraws puts in `<head>`.
 *
 * Why this exists: the metadata layer used to be typed as Next.js's `Metadata`.
 * That type is a rendering contract belonging to a specific framework, and it
 * was the only thing tying `lib/seo.ts` to Next.js. By describing the head as
 * plain data instead, the same `constructMetadata()` output can be rendered by
 * the Next.js `<Metadata>` machinery and by Astro's `SeoHead.astro` component
 * without either one owning the shape.
 *
 * The field types deliberately stay narrow (literal unions for `card` and
 * `type`, `SeoIconEntry[]` for icons) so that the object remains structurally
 * assignable to Next.js's `Metadata` for as long as both frameworks coexist.
 */

export type SeoOgType = 'website' | 'article';
export type SeoTwitterCard = 'summary' | 'summary_large_image';

export interface SeoIconEntry {
  url: string;
  sizes?: string;
  type?: string;
}

export interface SeoImage {
  url: string;
  width?: number;
  height?: number;
  alt?: string;
}

// `number` (not `number | string`) for the directive values: Next.js's own
// `RobotsInfo` types them as numbers, so widening them would make this object
// structurally incompatible with `Metadata` while the two frameworks coexist.
export interface SeoGoogleBot {
  index: boolean;
  follow: boolean;
  'max-video-preview'?: number;
  'max-image-preview'?: 'none' | 'standard' | 'large';
  'max-snippet'?: number;
}

export interface SeoRobots {
  index: boolean;
  follow: boolean;
  googleBot?: SeoGoogleBot;
}

export interface SeoAlternates {
  canonical: string;
  /** hreflang code -> absolute URL. Always includes `x-default`. */
  languages: Record<string, string>;
}

export interface SeoHead {
  title: string;
  description: string;
  keywords: string[];
  /**
   * Only used by Next.js to resolve *relative* asset paths. Astro ignores it
   * because `constructMetadata` already emits absolute canonical and OG URLs.
   */
  metadataBase: URL;
  authors: { name: string; url: string }[];
  creator: string;
  publisher: string;
  icons: {
    icon: SeoIconEntry[];
    shortcut: string;
    apple: string;
  };
  alternates: SeoAlternates;
  openGraph: {
    title: string;
    description: string;
    url: string;
    siteName: string;
    locale: string;
    type: SeoOgType;
    images: SeoImage[];
  };
  twitter: {
    card: SeoTwitterCard;
    title: string;
    description: string;
    images: string[];
  };
  robots: SeoRobots;
}

/** JSON-LD payloads are opaque to us; they are serialized verbatim. */
export type JsonLd = Record<string, unknown>;
