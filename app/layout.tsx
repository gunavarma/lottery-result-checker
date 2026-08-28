import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { OfflineBanner } from '@/components/OfflineBanner';
import { PwaInstallPrompt } from '@/components/PwaInstallPrompt';
import { ForegroundNotificationToast } from '@/components/ForegroundNotificationToast';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://keralalottery.org'),
  manifest: '/manifest.json',
  title: {
    default: 'Kerala Lottery Results Today | Latest Kerala Lottery Results',
    template: '%s | Kerala Lottery Results',
  },
  description:
    'Check official Kerala Lottery results today live, winning numbers, draw schedule, prize structure and previous results synchronized directly from the Directorate of Kerala State Lotteries LOTIS portal.',
  keywords: [
    'Kerala Lottery Results',
    'Kerala Lottery Result Today',
    'Kerala State Lotteries',
    'LOTIS',
    'Karunya Plus Result',
    'Sthree Sakthi Result',
    'Suvarna Keralam Result',
    'Fifty Fifty Lottery Result',
    'Kerala Lottery Winning Numbers',
    'Kerala Lottery Calendar',
  ],
  authors: [{ name: 'Kerala Lottery Results' }],
  creator: 'Kerala Lottery Results',
  publisher: 'Kerala Lottery Results',
  icons: {
    icon: '/logo.svg',
    shortcut: '/logo.svg',
    apple: '/logo.svg',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: 'Kerala Lottery Results Today | Latest Kerala Lottery Results',
    description:
      'Official Kerala State Lottery results, draw numbers, winning numbers and full prize details synchronized with official LOTIS government records.',
    url: '/',
    siteName: 'Kerala Lottery Results',
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kerala Lottery Results Today',
    description:
      'Official Kerala State Lottery results, draw numbers, and prize details updated live.',
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
  themeColor: '#059669',
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

  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="manifest" href="/manifest.json" />
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
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans antialiased selection:bg-emerald-500 selection:text-white pb-14 xl:pb-0">
        <OfflineBanner />
        <Navbar />
        <main className="flex-grow">{children}</main>
        <Footer />
        <PwaInstallPrompt />
        <ForegroundNotificationToast />
      </body>
    </html>
  );
}
