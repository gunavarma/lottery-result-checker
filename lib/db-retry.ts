/**
 * Retry for *transient* database connection failures.
 *
 * Connection exhaustion is not a data error: when the pooler refuses a
 * connection, the identical query usually succeeds a few hundred milliseconds
 * later because whichever instance was holding the connection has finished. The
 * production symptom this addresses is intermittent and visible — one request
 * returned `/api/results/latest` in 0.36s with six draws while, seconds apart,
 * `/api/results/today` and `/api/live` both failed with
 * `FATAL: (EMAXCONNSESSION) max clients reached in session mode`.
 *
 * Retrying a read is safe: these are all `findFirst` / `findMany` / `count`
 * queries with no side effects. Nothing here retries a write.
 *
 * The delays are deliberately short. This sits inside a page render, and a
 * failure that survives three fast attempts is a real outage that a longer wait
 * would only delay reporting. Worst case adds ~0.55s to a degraded render, which
 * is far cheaper than the empty page it replaces.
 */

/** Messages and Prisma error codes that mean "try again", not "your query is wrong". */
const RETRYABLE_PATTERNS: RegExp[] = [
  // Supabase/Supavisor refused the connection because the pool is full.
  /EMAXCONNSESSION/i,
  /max clients reached/i,
  /pool_size/i,
  // Prisma could not establish or keep a connection.
  /can't reach database server/i,
  /timed out fetching a new connection/i,
  /connection pool timed out/i,
  /server has closed the connection/i,
  /connection terminated unexpectedly/i,
  // Prisma error codes: P1001 unreachable, P1002 timeout, P1017 server closed,
  // P2024 pool timeout, P2037 too many connections.
  /\bP1001\b|\bP1002\b|\bP1017\b|\bP2024\b|\bP2037\b/,
  // Raw socket-level failures mid-handshake.
  /\bECONNRESET\b|\bETIMEDOUT\b|\bECONNREFUSED\b|\bEPIPE\b/,
];

export function isRetryableDbError(error: unknown): boolean {
  if (!error) return false;

  const message =
    error instanceof Error
      ? `${error.name}: ${error.message}`
      : typeof error === 'string'
        ? error
        : JSON.stringify(error);

  return RETRYABLE_PATTERNS.some((pattern) => pattern.test(message));
}

export interface RetryOptions {
  /** Total attempts, including the first. Default 3. */
  attempts?: number;
  /** Delay before each retry; the last value is reused if attempts exceed it. */
  delaysMs?: number[];
  /** Injected for tests. */
  sleep?: (ms: number) => Promise<void>;
}

export const DEFAULT_ATTEMPTS = 3;
export const DEFAULT_RETRY_DELAYS_MS = [150, 400];

/**
 * Runs `operation`, retrying only when the error looks like a transient
 * connection failure. A deterministic error (bad query, missing column) is
 * rethrown immediately so it is not masked by pointless delays.
 */
export async function withDbRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const attempts = options.attempts ?? DEFAULT_ATTEMPTS;
  const delays = options.delaysMs ?? DEFAULT_RETRY_DELAYS_MS;
  const sleep =
    options.sleep ?? ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)));

  let lastError: unknown;

  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (!isRetryableDbError(error) || attempt === attempts - 1) throw error;

      const delay = delays[Math.min(attempt, delays.length - 1)];
      console.warn(
        `[db-retry] transient database failure (attempt ${attempt + 1}/${attempts}), retrying in ${delay}ms:`,
        error instanceof Error ? error.message : error
      );
      await sleep(delay);
    }
  }

  throw lastError;
}
