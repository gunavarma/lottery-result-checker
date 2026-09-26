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
