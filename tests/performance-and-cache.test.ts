import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getOrSetCache, invalidateCache, getCacheStats } from '@/lib/cache';

describe('Performance & In-Memory SWR Cache Architecture', () => {
  beforeEach(() => {
    invalidateCache();
  });

  it('should fetch and cache data on first call', async () => {
    const fetcher = vi.fn().mockResolvedValue({ status: 'ok', data: [1, 2, 3] });

    const start = performance.now();
    const result1 = await getOrSetCache('test_key', fetcher, { ttlMs: 1000 });
    const duration1 = performance.now() - start;

    expect(result1).toEqual({ status: 'ok', data: [1, 2, 3] });
    expect(fetcher).toHaveBeenCalledTimes(1);

    // Second call should be a cache hit and super fast (< 5ms)
    const start2 = performance.now();
    const result2 = await getOrSetCache('test_key', fetcher, { ttlMs: 1000 });
    const duration2 = performance.now() - start2;

    expect(result2).toEqual({ status: 'ok', data: [1, 2, 3] });
    expect(fetcher).toHaveBeenCalledTimes(1); // No second database call
    expect(duration2).toBeLessThan(10); // Under 10ms
  });

  it('should support Stale-While-Revalidate background refresh', async () => {
    let counter = 0;
    const fetcher = vi.fn().mockImplementation(async () => {
      counter++;
      return { count: counter };
    });

    // 1. Initial call
    const res1 = await getOrSetCache('swr_key', fetcher, { ttlMs: 50, swrMs: 500 });
    expect(res1).toEqual({ count: 1 });
    expect(fetcher).toHaveBeenCalledTimes(1);

    // 2. Wait 60ms to make it stale (past 50ms TTL but within 500ms SWR)
    await new Promise((r) => setTimeout(r, 60));

    // 3. SWR Call: should return stale data (count: 1) immediately without blocking
    const res2 = await getOrSetCache('swr_key', fetcher, { ttlMs: 50, swrMs: 500 });
    expect(res2).toEqual({ count: 1 });

    // Wait a tick for background fetcher promise to resolve
    await new Promise((r) => setTimeout(r, 50));
    expect(fetcher).toHaveBeenCalledTimes(2);

    // 4. Next call should now have updated fresh data (count: 2)
    const res3 = await getOrSetCache('swr_key', fetcher, { ttlMs: 50, swrMs: 500 });
    expect(res3).toEqual({ count: 2 });
  });

  it('should invalidate cache keys properly', async () => {
    const fetcher = vi.fn().mockResolvedValue('val');

    await getOrSetCache('lottery_karunya', fetcher);
    await getOrSetCache('lottery_nirmal', fetcher);

    expect(getCacheStats().totalEntries).toBe(2);

    invalidateCache('lottery_karunya');
    expect(getCacheStats().totalEntries).toBe(1);

    invalidateCache();
    expect(getCacheStats().totalEntries).toBe(0);
  });
});
