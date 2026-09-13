'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchLiveResults, LiveDrawResponse } from '@/lib/api/lottery-results';
import { resultKeys } from '@/lib/queries/keys';

interface UseLiveResultsOptions {
  initialData?: LiveDrawResponse;
  enabled?: boolean;
}

/** 14:30 - 17:30 IST is the live publication window (draw at 3:00 PM, gazette ~4:30 PM). */
function isWithinLiveWindow(now: Date = new Date()): boolean {
  const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  const minutes = ist.getUTCHours() * 60 + ist.getUTCMinutes();
  return minutes >= 14 * 60 + 30 && minutes <= 17 * 60 + 30;
}

export function useLiveResults(options: UseLiveResultsOptions = {}) {
  return useQuery({
    queryKey: resultKeys.live(),
    queryFn: fetchLiveResults,
    initialData: options.initialData,
    enabled: options.enabled ?? true,
    // Live data must be re-checked frequently during the publication window.
    staleTime: 10 * 1000,
    gcTime: 10 * 60 * 1000,
    // Polling cadence adapts to the draw state. The server publishes within
    // ~60s of the source updating, so a 10s client poll keeps the worst-case
    // end-to-end lag around a minute while costing nothing once settled.
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return 30_000;

      // Provisional numbers stream in tier by tier: poll fast until complete.
      if (data.status === 'PROVISIONAL') {
        return data.completeness?.isComplete ? 30_000 : 10_000;
      }

      if (data.status === 'PUBLISHED') return false; // Official result is final.

      if (isWithinLiveWindow()) return 10_000;

      if (data.status === 'CHECKING' || data.status === 'RESULT_PENDING') return 20_000;

      return 60_000; // Gentle scheduled countdown check
    },
    refetchIntervalInBackground: false,
  });
}
