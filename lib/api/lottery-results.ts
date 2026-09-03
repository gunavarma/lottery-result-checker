import { LotteryHistoryParams } from '../queries/keys';

export interface LiveDrawResponse {
  success: boolean;
  status: 'SCHEDULED' | 'CHECKING' | 'RESULT_PENDING' | 'PUBLISHED' | 'SOURCE_UNAVAILABLE' | 'SYNC_ERROR';
  statusMessage: string;
  isPublished: boolean;
  countdownSeconds: number;
  scheduledLottery: {
    id: string;
    name: string;
    slug: string;
    code: string;
    drawDay: string;
    drawTime: string;
    ticketPrice: number;
    isBumper: boolean;
  } | null;
  todayDraw: any | null;
  latestDraw: any | null;
  latestSyncLog?: any;
  serverTimeIst: string;
}

export interface TodayResultResponse {
  success: boolean;
  isTodayAvailable: boolean;
  liveStatus: 'WAITING' | 'CHECKING' | 'PUBLISHED' | 'FAILED';
  todayDate: string;
  todayDateFormatted: string;
  todayDraw: any | null;
  latestDraw: any | null;
  scheduledLottery: any | null;
  secondsUntilDraw: number;
}

export interface DateResultResponse {
  success: boolean;
  date: string;
  count: number;
  draws: any[];
  error?: string;
}

export interface HistoryResultResponse {
  success: boolean;
  draws: any[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

/**
 * Client-side fetcher for Live Draw State Machine
 * Reads directly from internal DB cache; does not block on external LOTIS sources.
 */
export async function fetchLiveResults(): Promise<LiveDrawResponse> {
  const res = await fetch('/api/live', {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch live results: ${res.statusText}`);
  }
  return res.json();
}

/**
 * Client-side fetcher for Today's Lottery Result
 */
export async function fetchTodayResult(): Promise<TodayResultResponse> {
  const res = await fetch('/api/results/today', {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch today's results: ${res.statusText}`);
  }
  return res.json();
}

/**
 * Client-side fetcher for Date-specific Lottery Results
 */
export async function fetchLotteryResultByDate(date: string): Promise<DateResultResponse> {
  const res = await fetch(`/api/results/date/${encodeURIComponent(date)}`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch results for date ${date}: ${res.statusText}`);
  }
  return res.json();
}

/**
 * Client-side fetcher for Lottery Result Details
 */
export async function fetchLotteryResultDetail(slug: string, drawNumber?: string): Promise<any> {
  const path = drawNumber
    ? `/api/results/lottery/${encodeURIComponent(slug)}/${encodeURIComponent(drawNumber)}`
    : `/api/results/lottery/${encodeURIComponent(slug)}`;
  const res = await fetch(path, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch lottery result details: ${res.statusText}`);
  }
  return res.json();
}

/**
 * Client-side fetcher for Historical Lottery Results with Pagination
 */
export async function fetchLotteryHistory(
  params: LotteryHistoryParams = {}
): Promise<HistoryResultResponse> {
  const sp = new URLSearchParams();
  if (params.page) sp.set('page', String(params.page));
  if (params.limit) sp.set('limit', String(params.limit));
  if (params.lottery && params.lottery !== 'all') sp.set('lottery', params.lottery);
  if (params.year) sp.set('year', String(params.year));
  if (params.month) sp.set('month', String(params.month));
  if (params.date) sp.set('date', params.date);

  const res = await fetch(`/api/results/history?${sp.toString()}`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch lottery history: ${res.statusText}`);
  }
  return res.json();
}

/**
 * Client-side fetcher for Active Lottery Schemes
 */
export async function fetchLotteryList(): Promise<any[]> {
  const res = await fetch('/api/lotteries', {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch lottery directory: ${res.statusText}`);
  }
  const json = await res.json();
  return json.lotteries || json;
}
