'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchLiveResults, LiveDrawResponse } from '@/lib/api/lottery-results';
import { resultKeys } from '@/lib/queries/keys';

interface UseLiveResultsOptions {
  initialData?: LiveDrawResponse;
  enabled?: boolean;
}

export function useLiveResults(options: UseLiveResultsOptions = {}) {
  return useQuery({
    queryKey: resultKeys.live(),
    queryFn: fetchLiveResults,
    initialData: options.initialData,
    enabled: options.enabled ?? true,
    // Keep live data fresh for 15 seconds
    staleTime: 15 * 1000,
    gcTime: 10 * 60 * 1000,
    // Smart background polling: only poll during active checking states; stop once published
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return 30_000;
      if (data.status === 'PUBLISHED') return false; // Stop polling once published
      if (data.status === 'CHECKING' || data.status === 'RESULT_PENDING') {
        return 20_000; // Active draw window polling
      }
      return 60_000; // Gentle scheduled countdown check
    },
    refetchIntervalInBackground: false,
  });
}
