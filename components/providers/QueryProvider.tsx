'use client';

import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  // Ensure query client is created once per component lifecycle on the client
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Keep fresh for 60 seconds by default
            staleTime: 60 * 1000,
            // Keep in cache for 10 minutes
            gcTime: 10 * 60 * 1000,
            // Prevent noisy window focus refetches
            refetchOnWindowFocus: false,
            // Retry once on failure
            retry: 1,
            // Preserve previous data during pagination or parameter changes
            placeholderData: (previousData: any) => previousData,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
