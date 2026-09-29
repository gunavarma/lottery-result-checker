import { describe, it, expect } from 'vitest';
import {
  isServerlessRuntime,
  withConnectTimeout,
  withServerlessPoolLimits,
} from '@/lib/db-url';

describe('database connection string hardening', () => {
  it('appends connect_timeout when the URL has no query string', () => {
    expect(withConnectTimeout('postgresql://user:pw@host:5432/postgres')).toBe(
      'postgresql://user:pw@host:5432/postgres?connect_timeout=10'
    );
  });

  it('appends with & when a query string already exists', () => {
    expect(
      withConnectTimeout('postgresql://user:pw@host:6543/postgres?pgbouncer=true')
    ).toBe('postgresql://user:pw@host:6543/postgres?pgbouncer=true&connect_timeout=10');
  });

  it('never stacks a duplicate timeout', () => {
    const url = 'postgresql://user:pw@host:5432/postgres?connect_timeout=3';
    expect(withConnectTimeout(url)).toBe(url);
  });

  it('detects an existing timeout mid-query-string', () => {
    const url = 'postgresql://user:pw@host:5432/postgres?sslmode=require&connect_timeout=3';
    expect(withConnectTimeout(url)).toBe(url);
  });

  it('never re-encodes reserved characters in the password', () => {
    // Re-serialising through `new URL()` would turn these into %XX escapes and
    // break authentication, so the helper must be a pure text append.
    const url = 'postgresql://postgres.abc:p%40ss/w0rd?x#y@host:5432/postgres';
    const result = withConnectTimeout(url)!;
    expect(result.startsWith(url)).toBe(true);
    expect(result).toBe(`${url}&connect_timeout=10`);
  });

  it('passes through a missing URL untouched', () => {
    expect(withConnectTimeout(undefined)).toBeUndefined();
    expect(withConnectTimeout('')).toBe('');
  });

  it('accepts a caller-supplied timeout', () => {
    expect(withConnectTimeout('postgresql://host:5432/db', 30)).toBe(
      'postgresql://host:5432/db?connect_timeout=30'
    );
  });
});

describe('serverless pool limits', () => {
  const sessionPooler =
    'postgresql://postgres.abc:pw@aws-0.pooler.supabase.com:5432/postgres';

  it('caps the pool and bounds the wait', () => {
    expect(withServerlessPoolLimits(sessionPooler, { enabled: true })).toBe(
      `${sessionPooler}?connection_limit=1&pool_timeout=20`
    );
  });

  it('replaces an oversized connection_limit instead of stacking a second one', () => {
    // The production regression: the deployment's URL carried
    // `connection_limit=10` and every concurrent function instance honoured it,
    // which blew past the session pooler's fixed pool_size of 15. Appending here
    // would have left the value that caused the outage in first place.
    const url =
      'postgresql://postgres.abc:pw@aws-0.pooler.supabase.com:5432/postgres?pgbouncer=true&connection_limit=10';
    const result = withServerlessPoolLimits(url, { enabled: true })!;

    expect(result).toContain('connection_limit=1');
    expect(result).not.toContain('connection_limit=10');
    expect(result.match(/connection_limit=/g)).toHaveLength(1);
    expect(result).toContain('pgbouncer=true');
  });

  it('always appends exactly one connection_limit and one pool_timeout', () => {
    const url = 'postgresql://u:p@h:6543/db?connection_limit=10&pool_timeout=5&sslmode=require';
    const result = withServerlessPoolLimits(url, { enabled: true })!;

    expect(result.match(/connection_limit=/g)).toHaveLength(1);
    expect(result.match(/pool_timeout=/g)).toHaveLength(1);
    expect(result).toContain('pool_timeout=20');
    expect(result).toContain('sslmode=require');
  });

  it('leaves a non-serverless URL untouched', () => {
    // A developer machine is one long-lived process; a pool of 1 there would
    // serialise the whole app behind a single connection.
    expect(withServerlessPoolLimits(sessionPooler, { enabled: false })).toBe(sessionPooler);
  });

  it('never re-encodes the password', () => {
    const url = 'postgresql://postgres.abc:p%40ss/w0rd?x#y@host:5432/postgres';
    const result = withServerlessPoolLimits(url, { enabled: true })!;

    expect(result.startsWith(url)).toBe(true);
  });

  it('passes through a missing URL untouched', () => {
    expect(withServerlessPoolLimits(undefined, { enabled: true })).toBeUndefined();
  });

  it('accepts an explicit limit', () => {
    expect(
      withServerlessPoolLimits(sessionPooler, { enabled: true, connectionLimit: 3 })
    ).toContain('connection_limit=3');
  });

  it('detects the runtimes that scale a process out', () => {
    expect(isServerlessRuntime({ VERCEL: '1' })).toBe(true);
    expect(isServerlessRuntime({ AWS_LAMBDA_FUNCTION_NAME: 'fn' })).toBe(true);
    expect(isServerlessRuntime({ NETLIFY: 'true' })).toBe(true);
    expect(isServerlessRuntime({})).toBe(false);
  });
});
