'use client';

import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';

/**
 * Mounts a `QueryClientProvider` for one Astro island.
 *
 * The client itself comes from `getQueryClient()` rather than being created per
 * component, so all islands on a page share a single cache. See the explanation
 * in `lib/query-client.ts` for why this had to move out of the React tree.
 *
 * The `locale`/`language` props are accepted so that `withProviders()` can pass
 * them through to both providers uniformly; this one ignores them.
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={getQueryClient()}>{children}</QueryClientProvider>;
}
