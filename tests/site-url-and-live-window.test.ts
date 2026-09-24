import { describe, it, expect, afterEach, vi } from 'vitest';
import { computeLiveState, isWithinLiveWindow } from '@/lib/live-state';
import { IST_OFFSET_MS } from '@/lib/date';

/**
 * Regression guards for two production failures:
 *
 *  1. Canonical/hreflang/sitemap URLs pointed at http://localhost:3000 because a
 *     deployed build honoured a stray NEXT_PUBLIC_SITE_URL. Search engines saw
 *     the real pages as duplicates of an unreachable host.
 *  2. The homepage sat on "RESULT BEING UPDATED" with a spinner forever, because
 *     every minute after 15:00 IST counted as "checking" and nothing bounded it.
 */

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.resetModules();
});

async function resolveWith(env: Record<string, string | undefined>): Promise<string> {
  const wanted = [
    'NEXT_PUBLIC_SITE_URL',
    'VERCEL',
    'VERCEL_ENV',
    'VERCEL_URL',
    'VERCEL_PROJECT_PRODUCTION_URL',
  ];
  for (const key of wanted) delete (process.env as Record<string, string | undefined>)[key];
  for (const [key, value] of Object.entries(env)) {
    if (value !== undefined) process.env[key] = value;
  }
  vi.resetModules();
  const mod = await import('@/lib/site-url');
  return mod.SITE_URL;
}

describe('site origin resolution', () => {
  it('honours a loopback origin during local development', async () => {
    expect(await resolveWith({ NEXT_PUBLIC_SITE_URL: 'http://localhost:3000' })).toBe(
      'http://localhost:3000'
    );
  });

  it('never publishes a loopback origin from a deployed environment', async () => {
    const resolved = await resolveWith({
      NEXT_PUBLIC_SITE_URL: 'http://localhost:3000',
      VERCEL: '1',
      VERCEL_PROJECT_PRODUCTION_URL: 'www.keraladraws.com',
    });
    expect(resolved).toBe('https://www.keraladraws.com');
    expect(resolved).not.toMatch(/localhost/);
  });

  it('falls back to the production origin when Vercel provides no domain', async () => {
    expect(await resolveWith({ NEXT_PUBLIC_SITE_URL: 'http://127.0.0.1:3000', VERCEL: '1' })).toBe(
      'https://www.keraladraws.com'
    );
  });

  it('keeps an explicit public origin on a deployed environment', async () => {
    expect(
      await resolveWith({ NEXT_PUBLIC_SITE_URL: 'https://www.keraladraws.com', VERCEL: '1' })
    ).toBe('https://www.keraladraws.com');
  });

  it('normalizes a bare host and strips a trailing slash', async () => {
    expect(await resolveWith({ NEXT_PUBLIC_SITE_URL: 'keraladraws.com/' })).toBe(
      'https://keraladraws.com'
    );
  });
});

/** Builds an instant from an IST wall-clock time. */
function atIst(hour: number, minute = 0, day = 24): Date {
  return new Date(Date.UTC(2026, 8, day, hour, minute, 0) - IST_OFFSET_MS);
}

describe('bounded live window', () => {
  it('counts down before the draw', () => {
    const state = computeLiveState(false, atIst(14, 0));
    expect(state.liveStatus).toBe('WAITING');
    expect(state.secondsUntilDraw).toBe(60 * 60);
    expect(state.isTodayAvailable).toBe(false);
  });

  it('is "checking" only while the result can still arrive', () => {
    expect(computeLiveState(false, atIst(15, 0)).liveStatus).toBe('CHECKING');
    expect(computeLiveState(false, atIst(18, 59)).liveStatus).toBe('CHECKING');
  });

  it('stops spinning once the publication window has closed', () => {
    const late = computeLiveState(false, atIst(19, 0));
    expect(late.liveStatus).toBe('DELAYED');
    expect(late.secondsUntilDraw).toBe(0);

    // Late at night must stay "delayed", not fall back to a spinner.
    expect(computeLiveState(false, atIst(23, 30)).liveStatus).toBe('DELAYED');
  });

  it('reports a published draw as published at any hour', () => {
    const state = computeLiveState(true, atIst(16, 30));
    expect(state.liveStatus).toBe('PUBLISHED');
    expect(state.isTodayAvailable).toBe(true);
    expect(state.secondsUntilDraw).toBe(0);
  });

  it('derives the IST calendar date and weekday', () => {
    // 2026-09-24 is a Thursday; 00:30 IST is still the 24th, not the 23rd.
    const state = computeLiveState(false, atIst(0, 30));
    expect(state.todayDate).toBe('2026-09-24');
    expect(state.todayDayOfWeek).toBe('Thursday');
  });

  it('exposes the active polling window', () => {
    expect(isWithinLiveWindow(atIst(14, 0))).toBe(false);
    expect(isWithinLiveWindow(atIst(15, 30))).toBe(true);
    expect(isWithinLiveWindow(atIst(19, 30))).toBe(false);
  });
});
