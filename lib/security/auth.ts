import crypto from 'crypto';
import { NextResponse } from 'next/server';

/**
 * Centralized authentication for privileged server endpoints (cron + admin).
 *
 * Design rules:
 *  - Secrets come ONLY from server environment variables. There is intentionally
 *    no hardcoded fallback: a missing secret must never silently degrade into a
 *    well-known default that anyone can guess.
 *  - Comparisons are constant-time to avoid leaking the secret via timing.
 *  - Requests are authenticated by `Authorization: Bearer <secret>` (the exact
 *    header Vercel Cron sends) or, for manual operator use, `?secret=`.
 *  - Fail closed: if the secret is not configured in production, the endpoint
 *    returns 503 instead of running unauthenticated or with a public default.
 *  - Never log or return the secret value itself.
 */

export type AuthScope = 'cron' | 'admin';

/** Secrets that were previously committed/exposed and must never be accepted. */
const COMPROMISED_SECRETS = new Set([
  'kerala-lottery-cron-secure-token-2026',
  'admin-kerala-lottery-2026',
  'password',
  'secret',
  'changeme',
]);

const MIN_SECRET_LENGTH = 24;

/**
 * Constant-time string comparison that tolerates differing lengths.
 */
export function timingSafeEqualStr(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');

  if (bufA.length !== bufB.length) {
    // Still perform a comparison so the timing profile does not reveal length.
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }

  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Extracts the presented credential from a request without ever returning it
 * in a response or log.
 */
export function extractPresentedToken(request: Request): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader) {
    const bearer = authHeader.match(/^Bearer\s+(.+)$/i);
    if (bearer) return bearer[1].trim();
    return authHeader.trim();
  }

  try {
    const url = new URL(request.url);
    return url.searchParams.get('secret');
  } catch {
    return null;
  }
}

function readConfiguredSecret(scope: AuthScope): string | null {
  const raw = scope === 'cron' ? process.env.CRON_SECRET : process.env.ADMIN_SECRET;
  const trimmed = raw?.trim();
  return trimmed ? trimmed : null;
}

export interface AuthResult {
  authorized: boolean;
  /** HTTP status to use when authorization fails. */
  status: number;
  /** Safe, non-sensitive reason suitable for a JSON body. */
  reason?: string;
}

/**
 * Evaluates whether a request may run a privileged operation.
 */
export function evaluateAuth(request: Request, scope: AuthScope): AuthResult {
  const configured = readConfiguredSecret(scope);
  const isProduction = process.env.NODE_ENV === 'production';

  if (!configured) {
    if (isProduction) {
      console.error(
        `[Auth] ${scope.toUpperCase()} secret is not configured. Refusing to run privileged endpoint in production.`
      );
      return {
        authorized: false,
        status: 503,
        reason: 'Server misconfiguration: automation secret is not configured.',
      };
    }

    // Local / test convenience only. Never reachable in production.
    console.warn(`[Auth] ${scope.toUpperCase()} secret not set — allowing request in non-production mode.`);
    return { authorized: true, status: 200 };
  }

  if (isProduction && COMPROMISED_SECRETS.has(configured)) {
    console.error(
      `[Auth] ${scope.toUpperCase()} secret matches a previously exposed value and is rejected. Rotate it immediately.`
    );
    return {
      authorized: false,
      status: 503,
      reason: 'Automation secret has been rotated out. Update the configured secret.',
    };
  }

  if (isProduction && configured.length < MIN_SECRET_LENGTH) {
    console.error(`[Auth] ${scope.toUpperCase()} secret is too short to be considered safe.`);
    return {
      authorized: false,
      status: 503,
      reason: 'Automation secret does not meet the minimum strength requirement.',
    };
  }

  const presented = extractPresentedToken(request);

  if (!presented || !timingSafeEqualStr(presented, configured)) {
    return { authorized: false, status: 401, reason: 'Unauthorized' };
  }

  return { authorized: true, status: 200 };
}

/**
 * Convenience wrapper: returns a 401/503 NextResponse when the request is not
 * authorized, or `null` when the caller may proceed.
 */
export function denyUnauthorized(request: Request, scope: AuthScope): NextResponse | null {
  const result = evaluateAuth(request, scope);
  if (result.authorized) return null;

  return NextResponse.json(
    { success: false, error: result.reason || 'Unauthorized' },
    { status: result.status }
  );
}

/**
 * Authorizes when the request satisfies ANY of the given scopes (e.g. an
 * endpoint callable by both the cron pipeline and a human operator).
 */
export function denyUnauthorizedAny(request: Request, scopes: AuthScope[]): NextResponse | null {
  let status = 401;
  let reason = 'Unauthorized';

  for (const scope of scopes) {
    const result = evaluateAuth(request, scope);
    if (result.authorized) return null;
    if (result.status === 503) {
      status = 503;
      reason = result.reason || reason;
    }
  }

  return NextResponse.json({ success: false, error: reason }, { status });
}

/**
 * ------------------------------------------------------------------
 * Stored (rotatable) credential path
 * ------------------------------------------------------------------
 *
 * The environment secret above is the primary credential. This second source
 * exists because the frequent polling legs are driven by Supabase pg_cron
 * (Vercel's Hobby plan rejects sub-daily cron expressions), and a secret shared
 * between the database and the application has to live somewhere both can read.
 *
 * It also removes a real operational failure mode: rotating the environment
 * secret requires a Vercel dashboard edit plus a redeploy, and when that step is
 * missed the pipeline dies silently (every call returns 503) while the site
 * still looks healthy. A stored credential can be rotated by an operator in one
 * command with no deploy.
 *
 * Only the SHA-256 hash is stored, so a database read never reveals the secret.
 * The comparison stays constant-time against the digested value.
 */

const CREDENTIAL_CACHE_TTL_MS = 30_000;
const credentialCache = new Map<AuthScope, { hash: string | null; expiresAt: number }>();

/** Test/seeding hook: forget any cached stored credential. */
export function clearCredentialCache(): void {
  credentialCache.clear();
}

export function hashSecret(secret: string): string {
  return crypto.createHash('sha256').update(secret, 'utf8').digest('hex');
}

async function readStoredCredentialHash(scope: AuthScope): Promise<string | null> {
  const now = Date.now();
  const cached = credentialCache.get(scope);
  if (cached && cached.expiresAt > now) return cached.hash;

  try {
    // Imported lazily so that loading this module never requires a database
    // connection (tests and cron handlers both import it).
    const { prisma } = await import('@/lib/prisma');
    const row = await prisma.automationCredential.findUnique({ where: { scope } });
    const hash = row?.hash ?? null;
    credentialCache.set(scope, { hash, expiresAt: now + CREDENTIAL_CACHE_TTL_MS });
    return hash;
  } catch (error) {
    // An unreachable database must never authorize anyone; it only means the
    // stored credential is unavailable for this request.
    console.error(
      `[Auth] Could not read the stored ${scope} credential: ${(error as Error)?.message}`
    );
    credentialCache.set(scope, { hash: null, expiresAt: now + 5_000 });
    return null;
  }
}

/**
 * Full evaluation for privileged endpoints: the environment secret first (no
 * I/O), then the stored credential.
 *
 * Status semantics when nothing matched:
 *  - 503 only when *no* usable credential exists for the requested scopes
 *    (missing/compromised/too-short env secret and no stored row). This keeps
 *    the operator-visible "rotate me" signal instead of disguising a
 *    misconfiguration as a plain 401.
 *  - 401 otherwise, so an attacker learns nothing about the configuration.
 */
export async function evaluatePrivilegedAuth(
  request: Request,
  scopes: AuthScope[]
): Promise<AuthResult> {
  let misconfigured: AuthResult | null = null;

  for (const scope of scopes) {
    const result = evaluateAuth(request, scope);
    if (result.authorized) return result;
    if (result.status === 503) misconfigured = result;
  }

  const presented = extractPresentedToken(request);
  if (presented) {
    const digest = hashSecret(presented);
    for (const scope of scopes) {
      const storedHash = await readStoredCredentialHash(scope);
      if (!storedHash) continue;
      if (timingSafeEqualStr(digest, storedHash)) return { authorized: true, status: 200 };
    }

    if (misconfigured) return misconfigured;
    return { authorized: false, status: 401, reason: 'Unauthorized' };
  }

  return misconfigured ?? { authorized: false, status: 401, reason: 'Unauthorized' };
}

/**
 * Async guard for privileged routes: returns a 401/503 response when the
 * request may not proceed, or `null` when it is authorized.
 */
export async function requirePrivileged(
  request: Request,
  scopes: AuthScope | AuthScope[]
): Promise<NextResponse | null> {
  const list = Array.isArray(scopes) ? scopes : [scopes];
  const result = await evaluatePrivilegedAuth(request, list);
  if (result.authorized) return null;

  return NextResponse.json(
    { success: false, error: result.reason || 'Unauthorized' },
    { status: result.status }
  );
}

/**
 * Generates a cryptographically random secret suitable for CRON_SECRET /
 * ADMIN_SECRET. Used by the `npm run generate-secret` helper.
 */
export function generateSecret(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('base64url');
}
