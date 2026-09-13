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
 * Generates a cryptographically random secret suitable for CRON_SECRET /
 * ADMIN_SECRET. Used by the `npm run generate-secret` helper.
 */
export function generateSecret(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('base64url');
}
