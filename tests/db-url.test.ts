import { describe, it, expect } from 'vitest';
import { withConnectTimeout } from '@/lib/db-url';

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
