import { describe, it, expect } from 'vitest';

describe('Live Draw State Machine Resolution', () => {
  function resolveLiveState({
    isPublished,
    syncFailed,
    istHour,
    istMinute,
  }: {
    isPublished: boolean;
    syncFailed: boolean;
    istHour: number;
    istMinute: number;
  }) {
    if (isPublished) return 'PUBLISHED';
    if (syncFailed && istHour >= 15) return 'SOURCE_UNAVAILABLE';
    if (istHour === 15 || (istHour === 16 && istMinute <= 30)) return 'CHECKING';
    if (istHour >= 15) return 'RESULT_PENDING';
    return 'SCHEDULED';
  }

  it('resolves SCHEDULED before 3:00 PM IST', () => {
    const state = resolveLiveState({ isPublished: false, syncFailed: false, istHour: 14, istMinute: 30 });
    expect(state).toBe('SCHEDULED');
  });

  it('resolves CHECKING during 3:00 PM - 4:30 PM IST', () => {
    const state = resolveLiveState({ isPublished: false, syncFailed: false, istHour: 15, istMinute: 15 });
    expect(state).toBe('CHECKING');
  });

  it('resolves PUBLISHED once verified result is in database', () => {
    const state = resolveLiveState({ isPublished: true, syncFailed: false, istHour: 15, istMinute: 45 });
    expect(state).toBe('PUBLISHED');
  });

  it('resolves SOURCE_UNAVAILABLE if sync failed during draw hours', () => {
    const state = resolveLiveState({ isPublished: false, syncFailed: true, istHour: 15, istMinute: 30 });
    expect(state).toBe('SOURCE_UNAVAILABLE');
  });
});
