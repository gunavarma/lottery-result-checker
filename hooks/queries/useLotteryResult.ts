'use client';

import { useQuery } from '@tanstack/react-query';
import {
  fetchLotteryResultByDate,
  fetchLotteryResultDetail,
  DateResultResponse,
} from '@/lib/api/lottery-results';
import { resultKeys } from '@/lib/queries/keys';

interface UseLotteryResultByDateOptions {
  initialData?: DateResultResponse;
  enabled?: boolean;
}

export function useLotteryResultByDate(
  date: string,
  options: UseLotteryResultByDateOptions = {}
) {
  return useQuery({
    queryKey: resultKeys.byDate(date),
    queryFn: () => fetchLotteryResultByDate(date),
    initialData: options.initialData,
    enabled: (options.enabled ?? true) && !!date,
    // Historical results are immutable; cache fresh for 5 minutes
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    placeholderData: (previousData) => previousData,
  });
}

interface UseLotteryResultDetailOptions {
  initialData?: any;
  enabled?: boolean;
}

export function useLotteryResultDetail(
  slug: string,
  drawNumber?: string,
  options: UseLotteryResultDetailOptions = {}
) {
  return useQuery({
    queryKey: resultKeys.detail(slug, drawNumber),
    queryFn: () => fetchLotteryResultDetail(slug, drawNumber),
    initialData: options.initialData,
    enabled: (options.enabled ?? true) && !!slug,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    placeholderData: (previousData) => previousData,
  });
}
