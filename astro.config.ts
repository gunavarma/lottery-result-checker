import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import node from '@astrojs/node';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// `lib/site-url.ts` is the single source of truth for the public origin, so the
// sitemap and every canonical URL resolve through the same precedence rules the
// app has always used (SITE_URL -> VERCEL_PROJECT_PRODUCTION_URL -> known
// production origin).
import { resolveSiteUrl } from './lib/site-url';

const SITE_URL = resolveSiteUrl();

export default defineConfig({
  site: SITE_URL,

  srcDir: 'astro',

  output: 'server',

  adapter: process.env.VERCEL
    ? vercel({
        maxDuration: 60,
        webAnalytics: { enabled: false },
      })
    : node({
        mode: 'standalone',
      }),

  // NOTE: @astrojs/sitemap is deliberately NOT used. The sitemap is generated
  // from the database (only gazette-verified draws, per-URL hreflang alternates,
  // news + guide articles), so it is hand-ported as `src/pages/sitemap.xml.ts`
  // rather than derived from the static route list.
  integrations: [react()],

  // Result-detail documents are warmed only when a visitor signals intent
  // (hover/focus/tap).  This makes “View result” feel immediate without the
  // egress cost of prefetching every archive, scheme, and navigation link.
  prefetch: {
    prefetchAll: false,
    defaultStrategy: 'hover',
  },

  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'ml', 'ta', 'hi'],
    routing: {
      // English is the canonical unprefixed tree, exactly as the Next.js app
      // had it (the `(en)` route group + a `[locale]` tree for the rest).
      prefixDefaultLocale: false,
    },
  },

  // Node 20 inline env loading: `.env` is read by Astro's own loader, so no
  // extra dependency is needed to reach DATABASE_URL in dev.
  server: {
    // Kept at Next.js's old port so existing bookmarks, scripts and the
    // hardened `NEXT_PUBLIC_SITE_URL` loopback value keep pointing at the same
    // origin without any local reconfiguration.
    port: 3000,
  },

  vite: {
    plugins: [tailwindcss()],
    // Freeze the resolved origin into both bundles. Reading it from the
    // environment cannot work in the browser, and falling back there produced a
    // different value than the server render — so the origin is computed once,
    // here, and inlined identically into the client and the server.
    define: {
      __SITE_ORIGIN__: JSON.stringify(SITE_URL),
    },
    // `PUBLIC_` is Astro's own public prefix. `NEXT_PUBLIC_` is accepted as well
    // so a deployment that already has those variables set (Firebase, VAPID,
    // NEXT_PUBLIC_SITE_URL) keeps working without re-entering any value, and so
    // the client can read them through `import.meta.env` — which is the only
    // mechanism that works in the browser. Reading `process.env` there did not
    // fail loudly; it silently fell back to placeholder credentials.
    envPrefix: ['PUBLIC_', 'NEXT_PUBLIC_'],
    // Prisma and the PDF/Tesseract scrapers must stay external in the server
    // bundle; bundling them breaks their native binaries and dynamic requires.
    ssr: {
      external: ['@prisma/client', 'prisma', 'pdf-parse', 'tesseract.js'],
    },
    build: {
      // Target modern browsers for smaller output (matches package.json browserslist)
      target: 'es2022',
      // esbuild minification is already the default; cssMinify is also on.
      cssMinify: true,
      rollupOptions: {
        output: {
          // Split heavy vendor libraries into their own chunks so the browser
          // can cache them independently of page-specific code.
          manualChunks(id: string) {
            // React core (~42 KB gzip) — shared by every island, cached forever
            if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) {
              return 'react-vendor';
            }
            // TanStack React Query (~14 KB gzip)
            if (id.includes('node_modules/@tanstack/react-query')) {
              return 'query-vendor';
            }
            // date-fns (~8 KB gzip, tree-shaken)
            if (id.includes('node_modules/date-fns')) {
              return 'datefns-vendor';
            }
            // lucide icons (~5 KB per icon set, tree-shaken)
            if (id.includes('node_modules/lucide-react')) {
              return 'lucide-vendor';
            }
            // Firebase SDK (~180 KB) — only loaded by notification islands
            if (id.includes('node_modules/firebase')) {
              return 'firebase-vendor';
            }
          },
        },
      },
    },
  },
});
