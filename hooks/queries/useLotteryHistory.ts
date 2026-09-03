'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { fetchLotteryHistory, HistoryResultResponse } from '@/lib/api/lottery-results';
import { resultKeys, LotteryHistoryParams } from '@/lib/queries/keys';

interface UseLotteryHistoryOptions {
  initialData?: HistoryResultResponse;
  enabled?: boolean;
}

export function useLotteryHistory(
  params: LotteryHistoryParams = {},
  options: UseLotteryHistoryOptions = {}
) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: resultKeys.history(params),
    queryFn: () => fetchLotteryHistory(params),
    initialData: options.initialData,
    enabled: options.enabled ?? true,
    staleTime: 2 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    placeholderData: (previousData) => previousData,
  });

  // Prefetch next page for instant pagination
  const prefetchPage = useCallback(
    (pageNumber: number) => {
      if (pageNumber > 0) {
        queryClient.prefetchQuery({
          queryKey: resultKeys.history({ ...params, page: pageNumber }),
          queryFn: () => fetchLotteryHistory({ ...params, page: pageNumber }),
          staleTime: 2 * 60 * 1000,
        });
      }
    },
    [queryClient, params]
  );

  return {
    ...query,
    prefetchPage,
  };
}
