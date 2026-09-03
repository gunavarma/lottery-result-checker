export interface LotteryHistoryParams {
  page?: number;
  limit?: number;
  lottery?: string;
  year?: string | number;
  month?: string | number;
  date?: string;
}

export const resultKeys = {
  all: ['results'] as const,
  live: () => [...resultKeys.all, 'live'] as const,
  today: () => [...resultKeys.all, 'today'] as const,
  byDate: (date: string) => [...resultKeys.all, 'date', date] as const,
  detail: (slug: string, drawNumber?: string) =>
    [...resultKeys.all, 'detail', slug, drawNumber || 'latest'] as const,
  history: (params?: LotteryHistoryParams) =>
    [...resultKeys.all, 'history', params || {}] as const,
  lotteries: () => ['lotteries'] as const,
};
