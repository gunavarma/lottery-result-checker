import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { OfflineBanner } from '@/components/OfflineBanner';
import { PwaInstallPrompt } from '@/components/PwaInstallPrompt';
import { ForegroundNotificationToast } from '@/components/ForegroundNotificationToast';
import { StructuredData } from '@/components/StructuredData';
import {
  SITE_URL,
  SITE_NAME,
  SITE_TAGLINE,
  SITE_DESCRIPTION,
  getOrganizationSchema,
  getWebSiteSchema,
} from '@/lib/seo';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  manifest: '/manifest.json',
  title: {
    default: `${SITE_NAME} | Kerala Lottery Results Today, Ticket Checker & Alerts`,
    template: `%s | ${SITE_NAME}`,
  },
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
    icon: '/logo.svg',
    shortcut: '/logo.svg',
    apple: '/logo.svg',
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  const organizationSchema = getOrganizationSchema();
  const webSiteSchema = getWebSiteSchema();

  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <StructuredData data={[organizationSchema, webSiteSchema]} />
        {/* Google Analytics optional script */}
        {gaId && (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            />
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${gaId}', { page_path: window.location.pathname });
                `,
              }}
            />
          </>
        )}
      </head>
      <body className="min-h-screen flex flex-col bg-[#F7F7F4] text-[#17201D] font-sans antialiased selection:bg-[#0B3B32] selection:text-white pb-14 xl:pb-0">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2.5 focus:bg-[#0B3B32] focus:text-white focus:rounded-xl focus:shadow-xl focus:font-bold focus:text-xs"
        >
          Skip to main content
        </a>
        <OfflineBanner />
        <Navbar />
        <main id="main-content" className="flex-grow">{children}</main>
        <Footer />
        <PwaInstallPrompt />
        <ForegroundNotificationToast />
      </body>
    </html>
  );
}
