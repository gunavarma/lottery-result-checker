'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchLotteryList } from '@/lib/api/lottery-results';
import { resultKeys } from '@/lib/queries/keys';

interface UseLotteriesOptions {
  /** Only fetch when the server render did not already supply the schemes. */
  enabled?: boolean;
}

/**
 * Client-side fallback for the active schemes directory. `/api/lotteries`
 * returns the same nested shape the homepage server loader does, so the list
 * renders identically whether it came from the server render or this fallback.
 */
export function useLotteries(options: UseLotteriesOptions = {}) {
  return useQuery<any[]>({
    queryKey: resultKeys.lotteries(),
    queryFn: fetchLotteryList,
    enabled: options.enabled ?? true,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
