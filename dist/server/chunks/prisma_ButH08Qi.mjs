import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { PrismaClient } from "@prisma/client";
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
function withConnectTimeout(rawUrl, seconds = 10) {
	if (!rawUrl) return rawUrl;
	if (/[?&]connect_timeout=/.test(rawUrl)) return rawUrl;
	return `${rawUrl}${rawUrl.includes("?") ? "&" : "?"}connect_timeout=${seconds}`;
}
/**
* True on a platform that scales a function out into many short-lived
* instances, where each instance must keep its own pool tiny.
*/
function isServerlessRuntime(env = process.env) {
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
function setQueryParam(url, name, value) {
	const pattern = new RegExp(`([?&])${name}=[^&]*`);
	if (pattern.test(url)) return url.replace(pattern, `$1${name}=${value}`);
	return `${url}${url.includes("?") ? "&" : "?"}${name}=${value}`;
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
function withServerlessPoolLimits(rawUrl, options = {}) {
	if (!rawUrl) return rawUrl;
	if (!(options.enabled ?? isServerlessRuntime())) return rawUrl;
	const connectionLimit = options.connectionLimit ?? 1;
	const poolTimeout = options.poolTimeoutSeconds ?? 20;
	return setQueryParam(setQueryParam(rawUrl, "connection_limit", String(connectionLimit)), "pool_timeout", String(poolTimeout));
}
//#endregion
//#region lib/prisma.ts
var prisma_exports = /* @__PURE__ */ __exportAll({ prisma: () => prisma });
var connectionLimitOverride = Number(process.env.DATABASE_CONNECTION_LIMIT);
var datasourceUrl = withServerlessPoolLimits(withConnectTimeout(process.env.DATABASE_URL), { ...Number.isFinite(connectionLimitOverride) && connectionLimitOverride > 0 ? { connectionLimit: connectionLimitOverride } : {} });
var createPrismaClient = () => new PrismaClient({
	...datasourceUrl ? { datasourceUrl } : {},
	omit: omitAuditColumns,
	log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"]
});
var globalForPrisma = globalThis;
var omitAuditColumns = { draw: {
	rawText: true,
	sourceHash: true,
	sourceItemId: true,
	sourceProvider: true,
	lastCheckedAt: true
} };
var prisma = globalForPrisma.prisma ?? createPrismaClient();
globalForPrisma.prisma = prisma;
//#endregion
export { prisma_exports as n, prisma as t };
