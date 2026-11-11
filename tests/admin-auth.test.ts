import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  ADMIN_SESSION_COOKIE,
  adminSessionCookie,
  clearLoginAttempts,
  createSessionToken,
  getAdminConfig,
  isAdminSession,
  isSameOriginRequest,
  MIN_ADMIN_PASSWORD_LENGTH,
  readCookie,
  registerLoginAttempt,
  requireAdminApi,
  revokeSessionToken,
  verifyAdminCredentials,
  verifySessionToken,
} from '../lib/admin/session';

/**
 * These tests cover the properties that make the operator panel safe to expose:
 * the credential only comes from the environment, the cookie cannot be forged or
 * extended, and the API guard refuses callers without either credential.
 *
 * `NODE_ENV` is `test` under Vitest, so the development fallback is active
 * unless a test stubs a credential or forces `production`.
 */

const PASSWORD = 'correct horse battery staple 42';

function request(url = 'https://admin.example.test/api/admin/draws', init: RequestInit = {}) {
  return new Request(url, init);
}

beforeEach(() => {
  clearLoginAttempts();
  vi.stubEnv('ADMIN_USERNAME', '');
  vi.stubEnv('ADMIN_PASSWORD', '');
  vi.stubEnv('ADMIN_PASSWORD_SHA256', '');
  vi.stubEnv('ADMIN_SESSION_SECRET', '');
  vi.stubEnv('ADMIN_SECRET', '');
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('admin credential configuration', () => {
  it('falls back to the documented dev credential outside production', () => {
    const config = getAdminConfig();
    expect(config.configured).toBe(false);
    expect(config.devFallback).toBe(true);
    expect(verifyAdminCredentials('admin', 'admin')).toBe(true);
  });

  it('accepts the configured username and password', () => {
    vi.stubEnv('ADMIN_USERNAME', 'Operator');
    vi.stubEnv('ADMIN_PASSWORD', PASSWORD);

    expect(getAdminConfig()).toMatchObject({ configured: true, devFallback: false, username: 'operator' });
    expect(verifyAdminCredentials('operator', PASSWORD)).toBe(true);
    expect(verifyAdminCredentials('OPERATOR', PASSWORD)).toBe(true);
    expect(verifyAdminCredentials('operator', 'wrong')).toBe(false);
    expect(verifyAdminCredentials('admin', PASSWORD)).toBe(false);
    expect(verifyAdminCredentials('operator', '')).toBe(false);
  });

  it('accepts a SHA-256 password without keeping the plaintext', async () => {
    const { createHash } = await import('node:crypto');
    const digest = createHash('sha256').update(PASSWORD).digest('hex');
    vi.stubEnv('ADMIN_PASSWORD_SHA256', digest.toUpperCase());

    expect(verifyAdminCredentials('admin', PASSWORD)).toBe(true);
    expect(verifyAdminCredentials('admin', 'not-the-password')).toBe(false);
  });

  it('fails closed in production when no credential is configured', () => {
    vi.stubEnv('NODE_ENV', 'production');

    expect(getAdminConfig()).toMatchObject({ configured: false, devFallback: false });
    expect(verifyAdminCredentials('admin', 'admin')).toBe(false);
  });

  it('treats an empty ADMIN_PASSWORD as "not configured", never as an empty password', () => {
    // `ADMIN_PASSWORD=` in an env file is a common placeholder. It must not
    // become a valid (zero-length) credential.
    vi.stubEnv('ADMIN_PASSWORD', '   ');

    // Treated as unset: in development that means the documented fallback, in
    // production it means no login at all.
    expect(getAdminConfig()).toMatchObject({ configured: false, problem: null });
    expect(verifyAdminCredentials('admin', '')).toBe(false);

    vi.stubEnv('NODE_ENV', 'production');
    expect(getAdminConfig()).toMatchObject({ configured: false, devFallback: false });
    expect(verifyAdminCredentials('admin', '')).toBe(false);
    expect(verifyAdminCredentials('admin', 'admin')).toBe(false);
  });

  it('rejects a password shorter than the minimum length, in every environment', () => {
    vi.stubEnv('ADMIN_PASSWORD', 'short');

    const config = getAdminConfig();
    expect(config).toMatchObject({ configured: false, devFallback: false, problem: 'weak-password' });
    // Not even the dev fallback takes over: the operator supplied a weak
    // credential, so failing loudly beats silently running on a default.
    expect(verifyAdminCredentials('admin', 'short')).toBe(false);
    expect(verifyAdminCredentials('admin', 'admin')).toBe(false);
  });

  it('accepts a password at exactly the minimum length', () => {
    vi.stubEnv('ADMIN_PASSWORD', 'a'.repeat(MIN_ADMIN_PASSWORD_LENGTH));

    expect(getAdminConfig()).toMatchObject({ configured: true, problem: null });
    expect(verifyAdminCredentials('admin', 'a'.repeat(MIN_ADMIN_PASSWORD_LENGTH))).toBe(true);
  });

  it('rejects a malformed ADMIN_PASSWORD_SHA256 instead of silently locking the operator out', () => {
    vi.stubEnv('ADMIN_PASSWORD_SHA256', 'not-a-digest');

    expect(getAdminConfig()).toMatchObject({
      configured: false,
      devFallback: false,
      problem: 'malformed-hash',
    });
    expect(verifyAdminCredentials('admin', 'anything')).toBe(false);
  });
});

describe('admin session token', () => {
  it('round-trips a freshly issued token', () => {
    const token = createSessionToken();
    expect(verifySessionToken(token)).toBe(true);
    expect(isAdminSession(request('https://x.test/admin', { headers: { cookie: `${ADMIN_SESSION_COOKIE}=${token}` } }))).toBe(true);
  });

  it('rejects a tampered expiry and a tampered signature', () => {
    const token = createSessionToken();
    const [expiresAt, sessionId, signature] = token.split('.');
    const extended = String(Number(expiresAt) + 86_400_000);

    expect(verifySessionToken(`${extended}.${sessionId}.${signature}`)).toBe(false);
    expect(verifySessionToken(`${expiresAt}.${sessionId}.${signature.slice(0, -1)}${signature.endsWith('A') ? 'B' : 'A'}`)).toBe(false);
    // A different session id invalidates the signature binding.
    expect(verifySessionToken(`${expiresAt}.${'A'.repeat(sessionId.length)}.${signature}`)).toBe(false);
    expect(verifySessionToken('not-a-token')).toBe(false);
    expect(verifySessionToken('')).toBe(false);
    expect(verifySessionToken(null)).toBe(false);
  });

  it('stops accepting a session after it has been signed out', () => {
    const token = createSessionToken();
    expect(verifySessionToken(token)).toBe(true);

    revokeSessionToken(token);

    // The cookie value is unchanged and still correctly signed, but the
    // session has been ended, so it must no longer open the panel.
    expect(verifySessionToken(token)).toBe(false);
    expect(
      isAdminSession(request('https://x.test/admin', { headers: { cookie: `${ADMIN_SESSION_COOKIE}=${token}` } }))
    ).toBe(false);
  });

  it('ignores a sign-out attempt for a token it never issued', () => {
    const token = createSessionToken();
    const [expiresAt, sessionId] = token.split('.');
    const forged = `${expiresAt}.${sessionId}.forged-signature`;

    revokeSessionToken(forged);

    // The genuine session is untouched: a bogus cookie cannot knock out a
    // session it does not own.
    expect(verifySessionToken(token)).toBe(true);
  });

  it('keeps other sessions alive when one is signed out', () => {
    const first = createSessionToken();
    const second = createSessionToken();

    revokeSessionToken(first);

    expect(verifySessionToken(first)).toBe(false);
    expect(verifySessionToken(second)).toBe(true);
  });

  it('rejects an expired token', () => {
    const issuedAt = Date.now() - 9 * 60 * 60 * 1000;
    const token = createSessionToken(issuedAt);
    expect(verifySessionToken(token)).toBe(false);
  });

  it('invalidates outstanding sessions when the password changes', () => {
    vi.stubEnv('ADMIN_PASSWORD', 'first-password-which-is-long-enough');
    const token = createSessionToken();
    expect(verifySessionToken(token)).toBe(true);

    vi.stubEnv('ADMIN_PASSWORD', 'second-password-which-is-long-enough');
    expect(verifySessionToken(token)).toBe(false);
  });

  it('sets an HttpOnly, strict, path-scoped cookie', () => {
    const { name, value, options } = adminSessionCookie();
    expect(name).toBe(ADMIN_SESSION_COOKIE);
    expect(options).toMatchObject({ httpOnly: true, sameSite: 'strict', path: '/' });
    expect(options.maxAge).toBe(8 * 60 * 60);
    expect(verifySessionToken(value)).toBe(true);
  });

  it('reads one cookie out of a multi-cookie header', () => {
    expect(readCookie('a=1; kd_admin_session=abc.def; b=2', 'kd_admin_session')).toBe('abc.def');
    expect(readCookie('a=1', 'kd_admin_session')).toBeNull();
    expect(readCookie(null, 'kd_admin_session')).toBeNull();
  });
});

describe('admin request guards', () => {
  it('requires a same-origin caller for mutations', () => {
    const sameOrigin = request('https://admin.example.test/api/admin/results', {
      method: 'POST',
      headers: { origin: 'https://admin.example.test' },
    });
    const crossSite = request('https://admin.example.test/api/admin/results', {
      method: 'POST',
      headers: { origin: 'https://evil.example.test' },
    });
    const fetchMetadata = request('https://admin.example.test/api/admin/results', {
      method: 'POST',
      headers: { 'sec-fetch-site': 'cross-site' },
    });

    expect(isSameOriginRequest(sameOrigin)).toBe(true);
    expect(isSameOriginRequest(crossSite)).toBe(false);
    expect(isSameOriginRequest(fetchMetadata)).toBe(false);
  });

  it('accepts the browser session for reads and writes', async () => {
    const cookie = `${ADMIN_SESSION_COOKIE}=${createSessionToken()}`;
    const read = request('https://admin.example.test/api/admin/draws', { headers: { cookie } });
    const write = request('https://admin.example.test/api/admin/results', {
      method: 'POST',
      headers: { cookie, origin: 'https://admin.example.test' },
    });

    await expect(requireAdminApi(read)).resolves.toBeNull();
    await expect(requireAdminApi(write)).resolves.toBeNull();
  });

  it('rejects a cross-site write that carries a valid session cookie', async () => {
    const cookie = `${ADMIN_SESSION_COOKIE}=${createSessionToken()}`;
    const crossSite = request('https://admin.example.test/api/admin/results', {
      method: 'POST',
      headers: { cookie, origin: 'https://evil.example.test' },
    });

    const denied = await requireAdminApi(crossSite);
    expect(denied?.status).toBe(403);
  });

  it('rejects anonymous callers once ADMIN_SECRET is configured', async () => {
    vi.stubEnv('ADMIN_SECRET', 'a'.repeat(48));

    const denied = await requireAdminApi(request());
    expect(denied?.status).toBe(401);
    expect(denied?.headers.get('cache-control')).toBe('no-store');
  });

  it('still accepts a machine bearer secret', async () => {
    const secret = 'b'.repeat(48);
    vi.stubEnv('ADMIN_SECRET', secret);

    const authorized = request('https://admin.example.test/api/admin/results', {
      method: 'POST',
      headers: { authorization: `Bearer ${secret}` },
    });
    await expect(requireAdminApi(authorized)).resolves.toBeNull();
  });
});

describe('login rate limiting', () => {
  it('blocks after five attempts inside the window and resets afterwards', () => {
    const now = 1_000_000;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      expect(registerLoginAttempt('1.2.3.4', now).allowed).toBe(true);
    }

    const blocked = registerLoginAttempt('1.2.3.4', now + 1_000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);

    // A different address is unaffected.
    expect(registerLoginAttempt('5.6.7.8', now + 1_000).allowed).toBe(true);
    // The window passes.
    expect(registerLoginAttempt('1.2.3.4', now + 16 * 60 * 1000).allowed).toBe(true);
  });
});
