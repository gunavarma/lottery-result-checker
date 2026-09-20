import type { Metadata, Viewport } from 'next';
import '../globals.css';
import { RootChrome } from '@/components/layout/RootChrome';
import { StructuredData } from '@/components/StructuredData';
import {
  SITE_URL,
  SITE_NAME,
  SITE_TAGLINE,
  SITE_DESCRIPTION,
  getOrganizationSchema,
  getWebSiteSchema,
} from '@/lib/seo';
import { languageAlternates } from '@/lib/i18n/config';

let safeMetadataBase: URL;
try {
  safeMetadataBase = new URL(SITE_URL);
} catch {
  safeMetadataBase = new URL('https://keraladraws.com');
}

export const metadata: Metadata = {
  metadataBase: safeMetadataBase,
  manifest: '/manifest.json',
  title: `${SITE_NAME} | Kerala Lottery Results Today, Ticket Checker & Alerts`,
  description: SITE_DESCRIPTION,
  keywords: [
    'Kerala Lottery Result Today',
    'Kerala Lottery Results',
    'Kerala State Lotteries',
    'Kerala Lottery Winning Numbers',
    'Kerala Lottery Result Today Live',
    'Kerala Lottery Result Yesterday',
    'Kerala Lottery Ticket Check',
    'Kerala Lottery Ticket Checker',
    'Kerala Lottery Prize Structure',
    'Kerala Lottery Calendar',
    'Karunya Lottery Result',
    'Karunya Plus Result',
    'Bhagyathara Result',
    'Sthree Sakthi Result',
    'Suvarna Keralam Result',
    'Samrudhi Result',
    'Nirmal Result',
    'Win-Win Result',
    'Dhanalekshmi Result',
    'KeralaDraws',
  ],
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/logo.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.ico',
    apple: '/icon-192.png',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: `${SITE_NAME} | Kerala Lottery Results Today & Ticket Checker`,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: 'en_IN',
    type: 'website',
    images: [
      {
        url: `${SITE_URL}/logo.svg`,
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} - ${SITE_TAGLINE}`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} | Kerala Lottery Results Today`,
    description: SITE_DESCRIPTION,
    images: [`${SITE_URL}/logo.svg`],
  },
  alternates: {
    canonical: '/',
    languages: languageAlternates('/'),
  },
  robots: {
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

export const viewport: Viewport = {
  themeColor: '#0B3B32',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function EnRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const organizationSchema = getOrganizationSchema();
  const webSiteSchema = getWebSiteSchema();

  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <StructuredData data={[organizationSchema, webSiteSchema]} />
      </head>
      <body className="min-h-screen flex flex-col bg-[#F7F7F4] text-[#17201D] font-sans antialiased selection:bg-[#0B3B32] selection:text-white pb-14 xl:pb-0">
        <RootChrome>{children}</RootChrome>
      </body>
    </html>
  );
}
