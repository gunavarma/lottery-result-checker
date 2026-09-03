import { describe, it, expect } from 'vitest';
import { resultKeys } from '../lib/queries/keys';

describe('TanStack Query Key Architecture & Caching Contracts', () => {
  it('generates consistent and structured query keys', () => {
    expect(resultKeys.all).toEqual(['results']);
    expect(resultKeys.live()).toEqual(['results', 'live']);
    expect(resultKeys.today()).toEqual(['results', 'today']);
    expect(resultKeys.byDate('2026-08-28')).toEqual(['results', 'date', '2026-08-28']);
    expect(resultKeys.detail('suvarna-keralam', 'SK-67')).toEqual([
      'results',
      'detail',
      'suvarna-keralam',
      'SK-67',
    ]);
    expect(resultKeys.detail('suvarna-keralam')).toEqual([
      'results',
      'detail',
      'suvarna-keralam',
      'latest',
    ]);
    expect(resultKeys.history({ page: 2, limit: 12 })).toEqual([
      'results',
      'history',
      { page: 2, limit: 12 },
    ]);
    expect(resultKeys.lotteries()).toEqual(['lotteries']);
  });

  it('guarantees query isolation between different dates and schemes', () => {
    const key1 = resultKeys.byDate('2026-08-28');
    const key2 = resultKeys.byDate('2026-08-27');
    expect(key1).not.toEqual(key2);

    const scheme1 = resultKeys.detail('karunya-plus');
    const scheme2 = resultKeys.detail('sthree-sakthi');
    expect(scheme1).not.toEqual(scheme2);
  });
});
