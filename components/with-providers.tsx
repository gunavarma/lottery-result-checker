import React from 'react';
import type { Language } from '@/lib/translations';
import { LanguageProvider } from '@/context/LanguageContext';
import { QueryProvider } from '@/components/providers/QueryProvider';

/**
 * Wraps a component in the providers every island needs.
 *
 * Astro hydrates each `client:*` component as its own React root, so a provider
 * mounted once in the document layout cannot reach its siblings the way Next's
 * root `RootChrome` did. Each island therefore carries its own:
 *
 *   - `LanguageProvider` receives the locale as a prop from the Astro route, so
 *     the server and client agree and `/ml` never flashes English.
 *   - `QueryProvider` points every island at one shared browser `QueryClient`
 *     (see `lib/query-client.ts`), so the query cache and in-flight dedupe stay
 *     page-wide rather than per-island.
 *
 * This lives in its own module on purpose. It is imported by every island
 * wrapper, so if it lived in a barrel that also imported the components, that
 * barrel could not be tree-shaken and every page would download every island
 * (that is exactly what happened: a single 776 KB chunk containing all 17 page
 * components plus the QR scanner).
 */
export function withProviders<P extends object>(
  Component: React.ComponentType<P>
): (props: P & { locale?: Language }) => React.ReactElement | null {
  // The return type is the plain function signature rather than
  // `React.ComponentType<...>`. For components that declare no props at all
  // TypeScript falls back to the `P extends object` constraint, and
  // `ComponentType<object>` produces overloads that Astro's JSX checker cannot
  // resolve. A direct props signature sidesteps that ambiguity.
  function WithProviders(props: P & { locale?: Language }): React.ReactElement | null {
    const { locale = 'en', ...rest } = props as P & { locale?: Language };

    return (
      <LanguageProvider language={locale}>
        <QueryProvider>
          <Component {...(rest as P)} />
        </QueryProvider>
      </LanguageProvider>
    );
  }

  WithProviders.displayName = `WithProviders(${Component.displayName || Component.name || 'Component'})`;
  return WithProviders;
}

export function withLanguage<P extends object>(
  Component: React.ComponentType<P>
): (props: P & { locale?: Language }) => React.ReactElement | null {
  function WithLanguage(props: P & { locale?: Language }): React.ReactElement | null {
    const { locale = 'en', ...rest } = props as P & { locale?: Language };

    return (
      <LanguageProvider language={locale}>
        <Component {...(rest as P)} />
      </LanguageProvider>
    );
  }

  WithLanguage.displayName = `WithLanguage(${Component.displayName || Component.name || 'Component'})`;
  return WithLanguage;
}
