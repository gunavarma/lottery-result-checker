/**
 * Pure formatting/serialization helpers.
 *
 * These used to live in `lib/prisma.ts`, which meant every client component that
 * merely wanted to render a prize amount (`formatINR`) imported that module — and
 * with it `@prisma/client`, dragging Prisma's ~43 KB browser runtime into the
 * client bundle for *every* page. Ten client components did exactly that
 * (`ResultCard`, `PrizeTable`, `HeroTodayCard`, the whole results tree), and
 * because the navbar's search modal was one of them, the document-chrome chunk
 * pulled Prisma in too.
 *
 * They have no dependency on the database, so they belong in a module with no
 * `@prisma/client` import at all. `lib/prisma.ts` re-exports them so existing
 * server-side imports keep working unchanged.
 */

/** Converts BigInt values to numbers so a payload can cross a JSON boundary. */
export function serializeData<T>(data: T): T {
  return JSON.parse(
    JSON.stringify(data, (_, value) => (typeof value === 'bigint' ? Number(value) : value))
  );
}

/** Compact Indian-format currency, e.g. `₹1 Crore`, `₹50 Lakh`, `₹5,000`. */
export function formatINR(amount: number | bigint | string | null | undefined): string {
  if (amount === null || amount === undefined) return '₹0';
  const num = typeof amount === 'bigint' ? Number(amount) : Number(amount);
  if (isNaN(num)) return '₹0';

  if (num >= 10000000) {
    const cr = (num / 10000000).toLocaleString('en-IN', { maximumFractionDigits: 2 });
    return `₹${cr} Crore`;
  }
  if (num >= 100000) {
    const lk = (num / 100000).toLocaleString('en-IN', { maximumFractionDigits: 2 });
    return `₹${lk} Lakh`;
  }
  return `₹${num.toLocaleString('en-IN')}`;
}

/** Exact Indian-format currency, e.g. `₹1,00,00,000`. */
export function formatINRExact(amount: number | bigint | string | null | undefined): string {
  if (amount === null || amount === undefined) return '₹0';
  const num = typeof amount === 'bigint' ? Number(amount) : Number(amount);
  if (isNaN(num)) return '₹0';
  return `₹${num.toLocaleString('en-IN')}`;
}
