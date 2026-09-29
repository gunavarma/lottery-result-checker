import { describe, it, expect, vi } from 'vitest';
import { isRetryableDbError, withDbRetry } from '@/lib/db-retry';

// The exact failure production returned, observed on /api/results/today and
// /api/live while /api/results/latest succeeded seconds apart.
const EMAXCONNSESSION = new Error(
  'Error in connector: Error querying the database: FATAL: (EMAXCONNSESSION) max clients reached in session mode - max clients are limited to pool_size: 15'
);

const noSleep = () => Promise.resolve();

describe('transient database errors', () => {
  it('recognises connection exhaustion', () => {
    expect(isRetryableDbError(EMAXCONNSESSION)).toBe(true);
    expect(isRetryableDbError(new Error('Timed out fetching a new connection from the pool'))).toBe(
      true
    );
    expect(isRetryableDbError(new Error("Can't reach database server at `host:5432`"))).toBe(true);
    expect(isRetryableDbError({ code: 'P1001', message: 'nope' })).toBe(true);
  });

  it('does not retry a deterministic error', () => {
    // Retrying a bad query would only add latency before the same failure.
    expect(isRetryableDbError(new Error('Column `foo` does not exist in the current database'))).toBe(
      false
    );
    expect(isRetryableDbError(new Error('Unique constraint failed on the fields: (`slug`)'))).toBe(
      false
    );
    expect(isRetryableDbError(undefined)).toBe(false);
  });
});

describe('withDbRetry', () => {
  it('returns the first successful result without retrying', async () => {
    const operation = vi.fn().mockResolvedValue({ draws: [1, 2] });

    await expect(withDbRetry(operation, { sleep: noSleep })).resolves.toEqual({ draws: [1, 2] });
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('recovers from a transient failure', async () => {
    // This is the case that matters: the connection pool refused once and a
    // moment later the identical read succeeded.
    const operation = vi
      .fn()
      .mockRejectedValueOnce(EMAXCONNSESSION)
      .mockResolvedValueOnce({ success: true });

    await expect(withDbRetry(operation, { sleep: noSleep })).resolves.toEqual({ success: true });
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it('gives up after the configured attempts and rethrows the last error', async () => {
    const operation = vi.fn().mockRejectedValue(EMAXCONNSESSION);

    await expect(withDbRetry(operation, { sleep: noSleep })).rejects.toThrow('EMAXCONNSESSION');
    expect(operation).toHaveBeenCalledTimes(3);
  });

  it('does not waste attempts on a non-retryable error', async () => {
    const operation = vi.fn().mockRejectedValue(new Error('syntax error at or near "selct"'));

    await expect(withDbRetry(operation, { sleep: noSleep })).rejects.toThrow('syntax error');
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('waits between attempts using the supplied schedule', async () => {
    const delays: number[] = [];
    const operation = vi
      .fn()
      .mockRejectedValueOnce(EMAXCONNSESSION)
      .mockRejectedValueOnce(EMAXCONNSESSION)
      .mockResolvedValueOnce('ok');

    const result = await withDbRetry(operation, {
      delaysMs: [10, 20],
      sleep: (ms) => {
        delays.push(ms);
        return Promise.resolve();
      },
    });

    expect(result).toBe('ok');
    expect(delays).toEqual([10, 20]);
  });

  it('honours a custom attempt count', async () => {
    const operation = vi.fn().mockRejectedValue(EMAXCONNSESSION);

    await expect(withDbRetry(operation, { attempts: 5, sleep: noSleep })).rejects.toThrow();
    expect(operation).toHaveBeenCalledTimes(5);
  });
});
