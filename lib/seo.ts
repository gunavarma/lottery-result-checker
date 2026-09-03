import type { Metadata } from 'next';

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://keraladraws.com';
export const SITE_NAME = 'KeralaDraws';
export const SITE_TAGLINE = 'Kerala Lottery Results, Ticket Checker & Alerts';
export const SITE_DESCRIPTION =
  'Independent Kerala lottery results platform. Check official daily winning numbers, live draw status, complete prize structures, ticket verification and historical LOTIS gazette archives.';

/**
 * Normalizes and produces a clean canonical URL for KeralaDraws
 */
export function getCanonicalUrl(path: string = ''): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  // Strip trailing slashes except for root
  const trimmed = cleanPath === '/' ? '' : cleanPath.replace(/\/+$/, '');
  return `${SITE_URL}${trimmed}`;
}

/**
 * Base metadata configuration generator
 */
export function constructMetadata({
  title,
  description = SITE_DESCRIPTION,
  path = '',
  image = '/logo.svg',
  noIndex = false,
  keywords = [],
}: {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
  noIndex?: boolean;
  keywords?: string[];
}): Metadata {
  const cleanTitle = title
    ? title.replace(new RegExp(`(\\s*\\|\\s*${SITE_NAME})+$`, 'gi'), '').trim()
    : undefined;
  const fullTitle = cleanTitle ? `${cleanTitle} | ${SITE_NAME}` : `${SITE_NAME} | ${SITE_TAGLINE}`;
  const canonical = getCanonicalUrl(path);

  const defaultKeywords = [
    'Kerala Lottery Results',
    'Kerala Lottery Result Today',
    'Kerala State Lotteries',
    'Kerala Lottery Winning Numbers',
    'Kerala Lottery Ticket Check',
    'Kerala Lottery Prize Structure',
    'Kerala Lottery Calendar',
    'Karunya Plus Result',
    'Sthree Sakthi Result',
    'Suvarna Keralam Result',
    'Bhagya Thara Result',
    'Fifty Fifty Lottery Result',
    'Nirmal Result',
    'Win-Win Result',
    'KeralaDraws',
  ];

  const allKeywords = Array.from(new Set([...keywords, ...defaultKeywords]));

  return {
    title: fullTitle,
    description,
    keywords: allKeywords,
    alternates: {
      canonical,
    },
    metadataBase: new URL(SITE_URL),
    authors: [{ name: SITE_NAME, url: SITE_URL }],
    creator: SITE_NAME,
    publisher: SITE_NAME,
    icons: {
      icon: '/logo.svg',
      shortcut: '/logo.svg',
      apple: '/logo.svg',
    },
    openGraph: {
      title: fullTitle,
      description,
      url: canonical,
      siteName: SITE_NAME,
      locale: 'en_IN',
      type: 'website',
      images: [
        {
          url: image.startsWith('http') ? image : `${SITE_URL}${image}`,
          width: 1200,
          height: 630,
          alt: fullTitle,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [image.startsWith('http') ? image : `${SITE_URL}${image}`],
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
        }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
          },
        },
  };
}

/**
 * Organization Schema.org JSON-LD (Strictly Independent Platform)
 */
export function getOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    alternateName: 'KeralaDraws Lottery Information Platform',
    url: SITE_URL,
    logo: `${SITE_URL}/logo.svg`,
    description:
      'KeralaDraws is an independent informational platform providing automated Kerala State Lottery results, ticket checking tools, and prize breakdown analytics.',
    publishingPrinciples: `${SITE_URL}/about`,
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Support & Editorial Inquiries',
      url: `${SITE_URL}/contact`,
    },
  };
}

/**
 * WebSite Schema.org JSON-LD
 */
export function getWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    inLanguage: 'en-IN',
  };
}

/**
 * BreadcrumbList Schema.org JSON-LD
 */
export function getBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${SITE_URL}${item.url.startsWith('/') ? item.url : `/${item.url}`}`,
    })),
  };
}

/**
 * Article / NewsArticle Schema.org JSON-LD
 */
export function getNewsArticleSchema(article: {
  title: string;
  description: string;
  slug: string;
  publishedAt: string;
  updatedAt?: string;
  author?: string;
  image?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title,
    description: article.description,
    image: article.image ? (article.image.startsWith('http') ? article.image : `${SITE_URL}${article.image}`) : `${SITE_URL}/logo.svg`,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt || article.publishedAt,
    author: {
      '@type': 'Organization',
      name: article.author || SITE_NAME,
      url: SITE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/logo.svg`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/news/${article.slug}`,
    },
  };
}

/**
 * FAQPage Schema.org JSON-LD
 */
export function getFAQSchema(faqs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}
