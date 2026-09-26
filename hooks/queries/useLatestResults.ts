'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchLatestResults, LatestResultsResponse } from '@/lib/api/lottery-results';
import { resultKeys } from '@/lib/queries/keys';

interface UseLatestResultsOptions {
  /** Only fetch when the server render did not already supply the draws. */
  enabled?: boolean;
}

/**
 * Client-side fallback for the homepage's recent-results list. Recent results
 * change at most once a day per scheme, so the payload is cached generously and
 * only requested when the server payload came back empty.
 */
export function useLatestResults(
  limit = 6,
  options: UseLatestResultsOptions = {}
) {
  return useQuery<LatestResultsResponse>({
    queryKey: resultKeys.latest(limit),
    queryFn: () => fetchLatestResults(limit),
    enabled: options.enabled ?? true,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
