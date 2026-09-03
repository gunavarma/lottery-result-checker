'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchTodayResult, TodayResultResponse } from '@/lib/api/lottery-results';
import { resultKeys } from '@/lib/queries/keys';

interface UseLotteryResultsOptions {
  initialData?: TodayResultResponse;
  enabled?: boolean;
}

export function useLotteryResults(options: UseLotteryResultsOptions = {}) {
  return useQuery({
    queryKey: resultKeys.today(),
    queryFn: fetchTodayResult,
    initialData: options.initialData,
    enabled: options.enabled ?? true,
    staleTime: 30 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data?.isTodayAvailable) return false;
      return 30_000;
    },
  });
}
