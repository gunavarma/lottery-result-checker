import { describe, it, expect, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  evaluateAuth,
  timingSafeEqualStr,
  generateSecret,
  denyUnauthorizedAny,
} from '@/lib/security/auth';

function makeRequest(url: string, init?: RequestInit): Request {
  return new Request(url, init);
}

describe('Privileged endpoint authentication', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('compares secrets in constant time and rejects different lengths', () => {
    expect(timingSafeEqualStr('correct-horse-battery-staple', 'correct-horse-battery-staple')).toBe(true);
    expect(timingSafeEqualStr('correct-horse-battery-staple', 'correct-horse-battery-staplX')).toBe(false);
    expect(timingSafeEqualStr('short', 'a-much-longer-secret-value')).toBe(false);
    expect(timingSafeEqualStr('', '')).toBe(true);
  });

  it('generates unpredictable secrets of sufficient length', () => {
    const a = generateSecret();
    const b = generateSecret();
    expect(a).not.toBe(b);
    expect(a.length).toBeGreaterThanOrEqual(24);
  });

  it('fails closed in production when the secret is not configured', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('CRON_SECRET', '');

    const result = evaluateAuth(makeRequest('https://example.com/api/cron/sync-results'), 'cron');
    expect(result.authorized).toBe(false);
    expect(result.status).toBe(503);
  });

  it('rejects a previously exposed default secret in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('CRON_SECRET', 'kerala-lottery-cron-secure-token-2026');

    const request = makeRequest('https://example.com/api/cron/sync-results', {
      headers: { authorization: 'Bearer kerala-lottery-cron-secure-token-2026' },
    });

    const result = evaluateAuth(request, 'cron');
    expect(result.authorized).toBe(false);
    expect(result.status).toBe(503);
  });

  it('rejects secrets below the minimum strength requirement in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('CRON_SECRET', 'too-short');

    const result = evaluateAuth(
      makeRequest('https://example.com/api/cron/sync-results', {
        headers: { authorization: 'Bearer too-short' },
      }),
      'cron'
    );
    expect(result.authorized).toBe(false);
    expect(result.status).toBe(503);
  });

  it('accepts the correct bearer token and rejects wrong or missing tokens', () => {
    const secret = generateSecret();
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('CRON_SECRET', secret);

    const authorized = evaluateAuth(
      makeRequest('https://example.com/api/cron/sync-results', {
        headers: { authorization: `Bearer ${secret}` },
      }),
      'cron'
    );
    expect(authorized.authorized).toBe(true);

    const wrong = evaluateAuth(
      makeRequest('https://example.com/api/cron/sync-results', {
        headers: { authorization: 'Bearer not-the-secret-value-at-all' },
      }),
      'cron'
    );
    expect(wrong.authorized).toBe(false);
    expect(wrong.status).toBe(401);

    const missing = evaluateAuth(makeRequest('https://example.com/api/cron/sync-results'), 'cron');
    expect(missing.authorized).toBe(false);
    expect(missing.status).toBe(401);
  });

  it('accepts the secret via the query parameter for manual operator use', () => {
    const secret = generateSecret();
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('CRON_SECRET', secret);

    const result = evaluateAuth(
      makeRequest(`https://example.com/api/cron/sync-results?secret=${encodeURIComponent(secret)}`),
      'cron'
    );
    expect(result.authorized).toBe(true);
  });

  it('authorizes when any configured scope matches', () => {
    const cronSecret = generateSecret();
    const adminSecret = generateSecret();
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('CRON_SECRET', cronSecret);
    vi.stubEnv('ADMIN_SECRET', adminSecret);

    const asAdmin = makeRequest('https://example.com/api/notifications/dispatch', {
      headers: { authorization: `Bearer ${adminSecret}` },
    });
    expect(denyUnauthorizedAny(asAdmin, ['cron', 'admin'])).toBeNull();

    const asCron = makeRequest('https://example.com/api/notifications/dispatch', {
      headers: { authorization: `Bearer ${cronSecret}` },
    });
    expect(denyUnauthorizedAny(asCron, ['cron', 'admin'])).toBeNull();

    const asStranger = makeRequest('https://example.com/api/notifications/dispatch', {
      headers: { authorization: 'Bearer totally-wrong-but-long-enough' },
    });
    const denied = denyUnauthorizedAny(asStranger, ['cron', 'admin']);
    expect(denied).not.toBeNull();
    expect(denied!.status).toBe(401);
  });

  it('allows unauthenticated access only outside production', () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('ADMIN_SECRET', '');

    const result = evaluateAuth(makeRequest('https://localhost:3000/api/admin/sync'), 'admin');
    expect(result.authorized).toBe(true);
  });
});

describe('Security regression guards', () => {
  const projectRoot = process.cwd();

  function walk(dir: string): string[] {
    const full = path.join(projectRoot, dir);
    if (!fs.existsSync(full)) return [];
    return fs.readdirSync(full, { withFileTypes: true }).flatMap((entry) => {
      const rel = path.join(dir, entry.name);
      if (entry.isDirectory()) return walk(rel);
      return entry.name.endsWith('.ts') || entry.name.endsWith('.tsx') ? [rel] : [];
    });
  }

  it('has no hardcoded or defaulted automation secrets in route handlers', () => {
    const routeFiles = walk('app/api');
    expect(routeFiles.length).toBeGreaterThan(10);

    for (const file of routeFiles) {
      const source = fs.readFileSync(path.join(projectRoot, file), 'utf8');
      expect(source, `${file} must not contain the compromised cron secret`).not.toContain(
        'kerala-lottery-cron-secure-token-2026'
      );
      expect(source, `${file} must not contain the compromised admin secret`).not.toContain(
        'admin-kerala-lottery-2026'
      );
      expect(source, `${file} must not fall back to a default secret`).not.toMatch(
        /process\.env\.(CRON_SECRET|ADMIN_SECRET)\s*\|\|/
      );
    }
  });

  it('keeps the /api/live response contract aligned with the client hook usage', () => {
    const route = fs.readFileSync(path.join(projectRoot, 'app/api/live/route.ts'), 'utf8');
    const page = fs.readFileSync(path.join(projectRoot, 'app/live/page.tsx'), 'utf8');

    const usedFields = Array.from(page.matchAll(/liveData\?\.([A-Za-z0-9_]+)/g)).map((m) => m[1]);
    expect(usedFields.length).toBeGreaterThan(0);

    for (const field of new Set(usedFields)) {
      expect(route, `/api/live must return "${field}" used by app/live/page.tsx`).toContain(
        `${field}`
      );
    }

    // Guard against the renamed-field regression that broke the live page.
    expect(route).not.toContain('scheduledScheme');
    expect(route).not.toContain('serverTimeIST');
  });
});
