/**
 * PostgreSQL connection-string helpers shared by the Prisma client.
 *
 * Kept in its own module so the URL rewriting can be unit-tested without
 * instantiating a PrismaClient (which requires a live DATABASE_URL).
 */

/**
 * Prisma's built-in default is 5 seconds, and production was observed failing
 * at ~5.44s — i.e. the connect was being *abandoned* at exactly the 5s mark, not
 * refused. Doubling it gives the cold handshake room to finish while keeping the
 * worst-case render bounded: the homepage chains two such waits, so 10s caps it
 * near 20s rather than the 30s a 15s value would allow (next build gives a
 * prerendered page 60s).
 */
export const DEFAULT_CONNECT_TIMEOUT_SECONDS = 10;

/**
 * Ensure a `connect_timeout` is present on a PostgreSQL connection string.
 *
 * Prisma abandons a connection attempt after 5 seconds by default. A Vercel
 * function's first connection to the Supabase pooler can take longer on a cold
 * start; the abandoned attempt surfaces as
 * "Can't reach database server at ...:5432" and the render that hit it degrades
 * to an empty page. Raising the timeout keeps the cold handshake alive.
 *
 * Appended as text rather than re-serialised through `new URL()` so a password
 * containing reserved characters is never re-encoded (which would break auth).
 * An already-present value is respected, so this never stacks duplicates.
 */
export function withConnectTimeout(
  rawUrl: string | undefined,
  seconds: number = DEFAULT_CONNECT_TIMEOUT_SECONDS
): string | undefined {
  if (!rawUrl) return rawUrl;
  if (/[?&]connect_timeout=/.test(rawUrl)) return rawUrl;
  return `${rawUrl}${rawUrl.includes('?') ? '&' : '?'}connect_timeout=${seconds}`;
}

/**
 * Connections a single serverless instance may open.
 *
 * This is the parameter that actually caused the blank pages. The production
 * URL carried `connection_limit=10`, matching the local development file — but a
 * serverless platform runs many instances of the same function at once, and each
 * one honoured that 10. Against a Supabase *session* pooler, whose per-project
 * ceiling is `pool_size: 15`, the third warm instance to start a query was
 * refused with `FATAL: (EMAXCONNSESSION) max clients reached in session mode`,
 * which Prisma reported as a query error. Every page whose render read the
 * database then fell back to its empty state, most visibly for a visitor on a
 * fresh device with nothing cached in their browser.
 *
 * One connection per instance is the correct value for a serverless runtime: a
 * function instance serves one request at a time, so a wider pool buys nothing
 * and simply multiplies by the number of instances the platform spins up.
 */
export const SERVERLESS_CONNECTION_LIMIT = 1;

/**
 * How long a query waits for a free connection before giving up (Prisma's
 * `pool_timeout`). Above the platform's own 10s function ceiling this would
 * never be reached; 20s only applies to long-lived local processes.
 */
export const SERVERLESS_POOL_TIMEOUT_SECONDS = 20;

/**
 * True on a platform that scales a function out into many short-lived
 * instances, where each instance must keep its own pool tiny.
 */
export function isServerlessRuntime(
  env: Record<string, string | undefined> = process.env
): boolean {
  return Boolean(env.VERCEL || env.AWS_LAMBDA_FUNCTION_NAME || env.NETLIFY);
}

/**
 * Replaces a query parameter in place, or appends it when absent.
 *
 * `new URL()` is deliberately avoided: it re-encodes the password, which breaks
 * authentication for reserved characters. A plain text substitution keeps the
 * credential byte-for-byte identical, and replacing rather than appending means
 * an existing (too large) value is corrected instead of duplicated.
 */
function setQueryParam(url: string, name: string, value: string): string {
  const pattern = new RegExp(`([?&])${name}=[^&]*`);
  if (pattern.test(url)) return url.replace(pattern, `$1${name}=${value}`);
  return `${url}${url.includes('?') ? '&' : '?'}${name}=${value}`;
}

export interface PoolLimitOptions {
  /** Force the rewrite on or off; defaults to `isServerlessRuntime()`. */
  enabled?: boolean;
  connectionLimit?: number;
  poolTimeoutSeconds?: number;
}

/**
 * Cap the per-process pool for serverless deployments.
 *
 * Applied from the code rather than from the deployment's environment because
 * the environment is not always ours to edit: a platform that already holds the
 * old URL keeps handing out connections until someone changes a dashboard value.
 * This makes the client self-limiting regardless of what the URL says.
 *
 * An explicit `connectionLimit` replaces any existing `connection_limit=…`
 * instead of stacking a second copy, so a pre-existing value of 10 cannot win.
 */
export function withServerlessPoolLimits(
  rawUrl: string | undefined,
  options: PoolLimitOptions = {}
): string | undefined {
  if (!rawUrl) return rawUrl;

  const enabled = options.enabled ?? isServerlessRuntime();
  if (!enabled) return rawUrl;

  const connectionLimit = options.connectionLimit ?? SERVERLESS_CONNECTION_LIMIT;
  const poolTimeout = options.poolTimeoutSeconds ?? SERVERLESS_POOL_TIMEOUT_SECONDS;

  return setQueryParam(
    setQueryParam(rawUrl, 'connection_limit', String(connectionLimit)),
    'pool_timeout',
    String(poolTimeout)
  );
}
