import crypto from 'node:crypto';
import { requirePrivileged, timingSafeEqualStr } from '@/lib/security/auth';
import { IS_PRODUCTION_BUILD } from '@/lib/runtime-env';

/**
 * Password + signed-session authentication for the operator panel.
 *
 * Why this is separate from `lib/security/auth.ts`:
 *  - `auth.ts` authenticates *machine* callers with a bearer secret
 *    (`Authorization` header or `?secret=`). That is right for cron and wrong for
 *    a browser: a secret in a URL ends up in logs, history and Referer headers.
 *  - A panel needs a login form and a session that survives navigation without
 *    the operator pasting a token, so this module adds exactly two things: a
 *    password check and an HttpOnly, HMAC-signed cookie. Everything is still
 *    validated server-side; nothing secret is ever shipped to the client.
 *
 * Security rules, all fail-closed:
 *  - The credential comes only from the environment. In a production build a
 *    missing `ADMIN_PASSWORD` / `ADMIN_PASSWORD_SHA256` disables login (503),
 *    it never falls back to a known password — including when the production
 *    server is started without `NODE_ENV=production` (see `lib/runtime-env.ts`).
 *  - In a development build only, an unset credential falls back to `admin` so
 *    the panel is usable locally; the login page says so.
 *  - Comparisons are constant-time, the session is `HttpOnly` + `SameSite=Strict`
 *    (+ `Secure` on https), and the cookie value is HMAC-signed so it cannot be
 *    forged or edited into a longer expiry.
 *  - Login attempts are rate-limited per client address.
 */

export const ADMIN_SESSION_COOKIE = 'kd_admin_session';

/** Eight hours: long enough for an operator shift, short enough to expire. */
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

/** Development-only fallback. Never reachable with NODE_ENV=production. */
const DEV_PASSWORD = 'admin';

/** Five attempts per fifteen minutes per client address. */
const LOGIN_MAX_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

/**
 * Minimum length of a plaintext `ADMIN_PASSWORD`.
 *
 * The rate limiter is a speed bump (it is per instance, so a determined
 * attacker spreads attempts across instances), which makes a strong password
 * the *primary* defence. A short password is therefore rejected outright
 * rather than accepted and quietly relied upon.
 */
export const MIN_ADMIN_PASSWORD_LENGTH = 16;

/** A SHA-256 digest is 64 hex characters; anything else cannot match. */
const SHA256_HEX = /^[0-9a-f]{64}$/;

export interface AdminConfig {
  /** True when a real credential is configured through the environment. */
  configured: boolean;
  /** Username the panel accepts (case-insensitive). */
  username: string;
  /** True only in development, when no credential is configured. */
  devFallback: boolean;
  /** Non-reversible fingerprint of the credential; used to derive the HMAC key. */
  fingerprint: string | null;
  /**
   * Set when a credential *was* supplied but cannot be used.
   *
   * A rejected credential is a misconfiguration, not a missing one: the login
   * page must say "too short" rather than "not set", and login must stay
   * disabled either way. Never silently fall back to the dev credential when
   * the operator supplied a weak one.
   */
  problem: 'weak-password' | 'malformed-hash' | null;
}

const sha256 = (value: string): string =>
  crypto.createHash('sha256').update(value, 'utf8').digest('hex');

export function getAdminConfig(): AdminConfig {
  const username = (process.env.ADMIN_USERNAME?.trim() || 'admin').toLowerCase();
  const plain = process.env.ADMIN_PASSWORD?.trim() || '';
  const hashed = (process.env.ADMIN_PASSWORD_SHA256?.trim() || '').toLowerCase();
  const isProduction = IS_PRODUCTION_BUILD;

  if (hashed) {
    if (!SHA256_HEX.test(hashed)) {
      // A malformed digest can never match a real password, so accepting it
      // would lock the operator out with no explanation. Report it instead.
      console.error(
        '[Admin] ADMIN_PASSWORD_SHA256 is not a 64-character hex SHA-256 digest. Admin login is disabled.'
      );
      return {
        configured: false,
        username,
        devFallback: false,
        fingerprint: null,
        problem: 'malformed-hash',
      };
    }
    return { configured: true, username, devFallback: false, fingerprint: hashed, problem: null };
  }

  if (plain) {
    if (plain.length < MIN_ADMIN_PASSWORD_LENGTH) {
      console.error(
        `[Admin] ADMIN_PASSWORD is shorter than ${MIN_ADMIN_PASSWORD_LENGTH} characters. Admin login is disabled.`
      );
      return {
        configured: false,
        username,
        devFallback: false,
        fingerprint: null,
        problem: 'weak-password',
      };
    }
    return {
      configured: true,
      username,
      devFallback: false,
      fingerprint: sha256(plain),
      problem: null,
    };
  }

  if (!isProduction) {
    return {
      configured: false,
      username,
      devFallback: true,
      fingerprint: sha256(`${DEV_PASSWORD}:dev`),
      problem: null,
    };
  }
  return { configured: false, username, devFallback: false, fingerprint: null, problem: null };
}

/**
 * Constant-time credential check.
 *
 * The username is compared case-insensitively, and both comparisons always run
 * so a wrong username and a wrong password cost the same work.
 */
export function verifyAdminCredentials(
  username: string | null | undefined,
  password: string | null | undefined
): boolean {
  const config = getAdminConfig();
  if (!config.configured && !config.devFallback) return false;
  if (config.problem) return false;

  const presentedUser = (username ?? '').trim().toLowerCase();
  const userOk = timingSafeEqualStr(presentedUser, config.username);

  let passwordOk = false;
  if (!password) {
    passwordOk = false;
  } else if (config.devFallback) {
    passwordOk = timingSafeEqualStr(password, DEV_PASSWORD);
  } else {
    const hashed = (process.env.ADMIN_PASSWORD_SHA256?.trim() || '').toLowerCase();
    if (hashed) {
      passwordOk = timingSafeEqualStr(sha256(password), hashed);
    } else {
      passwordOk = timingSafeEqualStr(password, process.env.ADMIN_PASSWORD?.trim() || '');
    }
  }

  return userOk && passwordOk;
}

/**
 * HMAC key for the session cookie.
 *
 * Derived from the credential when `ADMIN_SESSION_SECRET` is not set, so rotating
 * the password also invalidates every outstanding session — that is the
 * behaviour an operator expects from "change the password".
 */
function sessionSecret(): string {
  const explicit = process.env.ADMIN_SESSION_SECRET?.trim();
  if (explicit) return explicit;

  const config = getAdminConfig();
  return sha256(`kd-admin-session:${config.username}:${config.fingerprint ?? 'unconfigured'}`);
}

function sign(payload: string): string {
  return crypto.createHmac('sha256', sessionSecret()).update(payload).digest('base64url');
}

/**
 * Session ids that were signed out, so the cookie can be refused server-side.
 *
 * A signed cookie stays valid until it expires even after the browser drops
 * it, so "Sign out" alone does not end the session: anyone still holding a
 * copy of the value (a shared machine's disk, a proxy log, a screenshot of
 * the cookie jar) could keep using the panel. Recording the id here makes the
 * sign-out real for this process.
 *
 * The list is per instance and pruned when entries expire, so on a serverless
 * host a sign-out is honoured by the instance that handled it. Rotating the
 * password (or `ADMIN_SESSION_SECRET`) invalidates every session everywhere,
 * and remains the way to force a global sign-out.
 */
const revokedSessions = new Map<string, number>();

/** Test hook. */
export function clearRevokedSessions(): void {
  revokedSessions.clear();
}

function pruneRevokedSessions(now: number): void {
  for (const [id, expiresAt] of revokedSessions) {
    if (expiresAt <= now) revokedSessions.delete(id);
  }
}

/**
 * `"<expiresAtMs>.<sessionId>.<base64url HMAC>"`. Contains no user data.
 *
 * The session id is random per login, which is what makes a targeted sign-out
 * possible: it identifies exactly one issued cookie and nothing else.
 */
export function createSessionToken(now: number = Date.now()): string {
  const expiresAt = now + SESSION_TTL_MS;
  const sessionId = crypto.randomBytes(16).toString('base64url');
  return `${expiresAt}.${sessionId}.${sign(`v2.${expiresAt}.${sessionId}`)}`;
}

/**
 * Ends the session carried by `token`.
 *
 * Only a token this module signed is revoked, so garbage (or a forged id) can
 * neither bloat the list nor knock out a session it does not own.
 */
export function revokeSessionToken(token: string | null | undefined, now: number = Date.now()): void {
  if (!token) return;
  const [expiresAtRaw, sessionId, signature] = token.split('.');
  if (!expiresAtRaw || !sessionId || !signature) return;

  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt) || expiresAt <= now) return;
  if (!timingSafeEqualStr(signature, sign(`v2.${expiresAtRaw}.${sessionId}`))) return;

  pruneRevokedSessions(now);
  revokedSessions.set(sessionId, expiresAt);
}

export function verifySessionToken(token: string | null | undefined, now: number = Date.now()): boolean {
  if (!token) return false;
  const [expiresAtRaw, sessionId, signature] = token.split('.');
  if (!expiresAtRaw || !sessionId || !signature) return false;

  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt) || expiresAt <= now) return false;

  const revokedUntil = revokedSessions.get(sessionId);
  if (revokedUntil !== undefined) {
    if (revokedUntil > now) return false;
    revokedSessions.delete(sessionId);
  }

  return timingSafeEqualStr(signature, sign(`v2.${expiresAtRaw}.${sessionId}`));
}

/** Reads one cookie from a `Cookie` header without allocating a cookie parser. */
export function readCookie(cookieHeader: string | null | undefined, name: string): string | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(';')) {
    const index = part.indexOf('=');
    if (index === -1) continue;
    if (part.slice(0, index).trim() !== name) continue;
    return decodeURIComponent(part.slice(index + 1).trim());
  }
  return null;
}

export function readSessionFromRequest(request: Request): string | null {
  return readCookie(request.headers.get('cookie'), ADMIN_SESSION_COOKIE);
}

/** True when the request carries a valid, unexpired admin session cookie. */
export function isAdminSession(request: Request): boolean {
  return verifySessionToken(readSessionFromRequest(request));
}

/**
 * Rejects cross-site mutations even if a browser ignores SameSite.
 *
 * Browsers send `Origin` on POST; when it is present it must match the request's
 * own origin. A missing `Origin` is accepted only for same-origin navigations
 * (`Sec-Fetch-Site: same-origin`), never for a cross-site form post.
 */
export function isSameOriginRequest(request: Request): boolean {
  const origin = request.headers.get('origin');
  let requestOrigin: string;
  try {
    requestOrigin = new URL(request.url).origin;
  } catch {
    return false;
  }

  if (origin) return origin === requestOrigin;

  const fetchSite = request.headers.get('sec-fetch-site');
  if (fetchSite) return fetchSite === 'same-origin';

  // No Origin and no Sec-Fetch-Site: a non-browser client. The cookie is
  // HttpOnly + SameSite=Strict, so this only affects scripted sessions.
  return true;
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

const loginAttempts = new Map<string, { count: number; resetAt: number }>();

/** Test hook. */
export function clearLoginAttempts(): void {
  loginAttempts.clear();
}

/**
 * Counts a login attempt for `key` (the client address).
 *
 * Best-effort per server instance: on serverless hosts a determined attacker can
 * spread attempts across instances, so this is a speed bump, not the primary
 * defence. The primary defence is the minimum password length below.
 */
export function registerLoginAttempt(
  key: string,
  now: number = Date.now()
): RateLimitResult {
  const entry = loginAttempts.get(key);

  if (!entry || entry.resetAt <= now) {
    loginAttempts.set(key, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  entry.count += 1;
  if (entry.count > LOGIN_MAX_ATTEMPTS) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
    };
  }
  return { allowed: true, retryAfterSeconds: 0 };
}

/** Client address for rate limiting, honouring the first proxy hop. */
export function clientKey(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim() || 'unknown';
  return request.headers.get('x-real-ip')?.trim() || 'unknown';
}

/**
 * Guard for admin API routes.
 *
 * Accepts either a browser session cookie or a machine bearer secret
 * (`ADMIN_SECRET`), because the operational scripts authenticate as machines.
 * Returns a ready-to-return `Response` when the caller may not proceed.
 */
export async function requireAdminApi(request: Request): Promise<Response | null> {
  if (isAdminSession(request)) {
    // Mutations additionally require a same-origin caller.
    if (request.method !== 'GET' && request.method !== 'HEAD' && !isSameOriginRequest(request)) {
      return Response.json(
        { success: false, error: 'Cross-site request rejected' },
        { status: 403, headers: { 'Cache-Control': 'no-store' } }
      );
    }
    return null;
  }

  // Machine caller path: the same rules the cron endpoints use. `auth.ts`
  // imports Prisma lazily itself, so a static import here does not pull a
  // database connection into the module graph.
  const denied = await requirePrivileged(request, 'admin');
  if (denied) {
    // Do not advertise *how* to authenticate beyond the failure itself.
    denied.headers.set('Cache-Control', 'no-store');
    return denied;
  }
  return null;
}

export function adminSessionCookie(
  options: { maxAgeSeconds?: number; secure?: boolean } = {}
): {
  name: string;
  value: string;
  options: {
    httpOnly: true;
    sameSite: 'strict';
    secure: boolean;
    path: string;
    maxAge: number;
  };
} {
  const maxAgeSeconds = options.maxAgeSeconds ?? SESSION_TTL_MS / 1000;
  return {
    name: ADMIN_SESSION_COOKIE,
    value: createSessionToken(),
    options: {
      httpOnly: true,
      sameSite: 'strict',
      secure: options.secure ?? process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: maxAgeSeconds,
    },
  };
}

/**
 * Whether the request arrived over TLS.
 *
 * Behind a TLS-terminating proxy the socket the server sees is plain http, so
 * the request URL alone under-reports it; `X-Forwarded-Proto` is what Vercel,
 * nginx and Caddy set. Getting this wrong in the other direction would make
 * the browser drop the session cookie on a local http preview.
 */
export function isSecureRequest(request: Request): boolean {
  const forwarded = request.headers.get('x-forwarded-proto');
  if (forwarded) return forwarded.split(',')[0].trim().toLowerCase() === 'https';
  try {
    return new URL(request.url).protocol === 'https:';
  } catch {
    return false;
  }
}
