import { PrismaClient } from '@prisma/client';
import { withConnectTimeout, withServerlessPoolLimits } from './db-url';

// Two adjustments to the connection string, both applied from code so the
// deployment environment does not have to be edited for the client to behave:
//
// 1. `withConnectTimeout` raises Prisma's 5s default connection timeout, which a
//    cold Vercel function's first handshake with the Supabase pooler can exceed —
//    the abandoned attempt surfaced as "Can't reach database server" (observed
//    failing at ~5.44s) and degraded the affected render to an empty page.
// 2. `withServerlessPoolLimits` caps each function instance's pool. Without it, a
//    URL carrying `connection_limit=10` is honoured by *every* concurrent
//    instance, which exceeds the Supabase session pooler's fixed `pool_size: 15`
//    and produced `(EMAXCONNSESSION) max clients reached` — the reason a fresh
//    device was shown empty results while the rows sat safely in the database.
const connectionLimitOverride = Number(process.env.DATABASE_CONNECTION_LIMIT);
const datasourceUrl = withServerlessPoolLimits(withConnectTimeout(process.env.DATABASE_URL), {
  ...(Number.isFinite(connectionLimitOverride) && connectionLimitOverride > 0
    ? { connectionLimit: connectionLimitOverride }
    : {}),
});

function createPrismaClient() {
  return new PrismaClient({
    ...(datasourceUrl ? { datasourceUrl } : {}),
    // `rawText` is the captured source-document audit trail (up to 20 KB for
    // each draw). Public pages and API responses never render it, yet Prisma's
    // default `include` returned it whenever a Draw was loaded. Omitting it at
    // the client boundary protects every read path from accidentally turning
    // audit storage into Supabase egress or browser payload.
    omit: {
      draw: {
        rawText: true,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
}

// `omit` changes Prisma's result type, so retain the precise factory return
// type in the development singleton rather than widening it to `PrismaClient`.
type AppPrismaClient = ReturnType<typeof createPrismaClient>;

// Prevent multiple instances of Prisma Client in development.
const globalForPrisma = globalThis as unknown as {
  prisma: AppPrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// BigInt JSON serializer helper for Next.js API routes and server components
export function serializeData<T>(data: T): T {
  return JSON.parse(
    JSON.stringify(data, (_, value) =>
      typeof value === 'bigint' ? Number(value) : value
    )
  );
}

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

export function formatINRExact(amount: number | bigint | string | null | undefined): string {
  if (amount === null || amount === undefined) return '₹0';
  const num = typeof amount === 'bigint' ? Number(amount) : Number(amount);
  if (isNaN(num)) return '₹0';
  return `₹${num.toLocaleString('en-IN')}`;
}
