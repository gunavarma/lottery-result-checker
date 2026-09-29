import { QueryClient } from '@tanstack/react-query';

/**
 * Shared `QueryClient`.
 *
 * Under Next.js a single `QueryProvider` sat at the root of the React tree, so
 * every client component shared one query cache and one set of in-flight
 * requests. Astro's island architecture breaks that assumption: each island is
 * its own React root and hydrates independently, so a provider *component*
 * mounted inside a layout cannot wrap siblings.
 *
 * The fix is to hoist the cache out of the React tree. Every island that needs
 * data mounts its own cheap `QueryClientProvider`, but they all point at the
 * same module-level instance, so a `queryKey` is still fetched once per page and
 * `setQueryData`/`invalidateQueries` from one island are visible to the others.
 *
 * The instance is deliberately browser-only. On the server a fresh client is
 * created per call, because a module-level singleton there would be shared
 * across concurrent requests and leak one visitor's cached data into another's
 * response.
 */
function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Keep fresh for 60 seconds by default.
        staleTime: 60 * 1000,
        // Keep in cache for 10 minutes.
        gcTime: 10 * 60 * 1000,
        // Prevent noisy window focus refetches.
        refetchOnWindowFocus: false,
        // Retry once on failure.
        retry: 1,
        // Preserve previous data during pagination or parameter changes.
        placeholderData: (previousData: unknown) => previousData,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

/** The cache instance to use for the current environment. */
export function getQueryClient(): QueryClient {
  if (typeof window === 'undefined') return createQueryClient();
  if (!browserQueryClient) browserQueryClient = createQueryClient();
  return browserQueryClient;
}
