'use client';

import Script from 'next/script';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { OfflineBanner } from '@/components/OfflineBanner';
import { PwaInstallPrompt } from '@/components/PwaInstallPrompt';
import { ForegroundNotificationToast } from '@/components/ForegroundNotificationToast';
import { LanguageProvider } from '@/context/LanguageContext';
import { QueryProvider } from '@/components/providers/QueryProvider';

// Shared body chrome used by both root layouts so the two locale trees stay
// pixel- and behaviour-identical. The <html>/<head> shells live in the layouts.
export function RootChrome({ children }: { children: React.ReactNode }) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  return (
    <LanguageProvider>
      <QueryProvider>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2.5 focus:bg-[#0B3B32] focus:text-white focus:rounded-xl focus:shadow-xl focus:font-bold focus:text-xs"
        >
          Skip to main content
        </a>
        <OfflineBanner />
        <Navbar />
        <main id="main-content" className="flex-grow">
          {children}
        </main>
        <Footer />
        <PwaInstallPrompt />
        <ForegroundNotificationToast />

        {/* Optional Google Analytics Script */}
        {gaId && (
          <>
            <Script
              strategy="afterInteractive"
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            />
            <Script
              id="ga-init"
              strategy="afterInteractive"
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
      </QueryProvider>
    </LanguageProvider>
  );
}
