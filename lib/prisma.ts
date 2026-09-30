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

// Prevent multiple instances of Prisma Client in development. The client is
// built through a factory so the global's type is the *inferred* client type
// (with its omit configuration) instead of the bare `PrismaClient`, which the
// configured client is not assignable to.
const createPrismaClient = () =>
  new PrismaClient({
    ...(datasourceUrl ? { datasourceUrl } : {}),
    omit: omitAuditColumns,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

type AppPrismaClient = ReturnType<typeof createPrismaClient>;

const globalForPrisma = globalThis as unknown as {
  prisma: AppPrismaClient | undefined;
};

// 3. Global column omission — the single biggest egress fix in this file.
//
// `include: { ... }` in Prisma selects **every scalar field** of the included
// model. That meant every draw read carried `rawText` — the source Gazette/LOTIS
// document text, stored up to 20 KB per draw (`keralalotteries/parser.ts`
// truncates at 20 000 chars) and ~7.4 KB on average across all 1 848 draws in
// production. Measured: 84.5 KB transferred for a single draw, 260 KB for the
// 30-draw archive page, 845 KB for one ticket check. The column is an audit
// trail that **no code path reads** (verified by grepping every consumer for
// `.rawText`, `.sourceHash`, `.sourceItemId`, `.sourceProvider`,
// `.lastCheckedAt`) and, under Next.js, it was even shipped to the browser in the
// RSC payload.
//
// Declaring the omission on the client strips these columns from *every* read
// path — including the queries that still use `include` — so no future call site
// can reintroduce the leak by forgetting a projection. Writes are unaffected:
// ingestion still stores the full document text; it is simply never sent back
// out over the wire unless a query asks for it by name.
const omitAuditColumns = {
  draw: {
    rawText: true,
    sourceHash: true,
    sourceItemId: true,
    sourceProvider: true,
    lastCheckedAt: true,
  },
} as const;

export const prisma: AppPrismaClient = globalForPrisma.prisma ?? createPrismaClient();

globalForPrisma.prisma = prisma;

// The pure helpers now live in `lib/format.ts` and are re-exported here so
// server-side imports of them keep working. They were moved because importing
// this module for a formatter pulled the whole Prisma client into the *browser*
// bundle; see the note in `lib/format.ts`.
export { serializeData, formatINR, formatINRExact } from './format';
