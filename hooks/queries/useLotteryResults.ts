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
      // Outside the 15:00-19:00 IST publication window nothing can arrive
      // sooner than the next draw, so poll infrequently: the old unconditional
      // 30s interval kept hitting the API all evening and all night for a
      // result that was simply never coming that day.
      if (data?.liveStatus === 'DELAYED') return 5 * 60 * 1000;
      return 30_000;
    },
  });
}
