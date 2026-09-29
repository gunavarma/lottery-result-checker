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

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    ...(datasourceUrl ? { datasourceUrl } : {}),
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// The pure helpers now live in `lib/format.ts` and are re-exported here so
// server-side imports of them keep working. They were moved because importing
// this module for a formatter pulled the whole Prisma client into the *browser*
// bundle; see the note in `lib/format.ts`.
export { serializeData, formatINR, formatINRExact } from './format';
