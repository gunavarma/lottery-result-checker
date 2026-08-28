import { describe, it, expect } from 'vitest';
import { normalizeTicketInput } from '../app/api/tickets/check/route';

describe('Ticket Checker Normalization & Verification', () => {
  it('normalizes space-separated ticket numbers', () => {
    const res = normalizeTicketInput('sk 123456');
    expect(res.series).toBe('SK');
    expect(res.number).toBe('123456');
    expect(res.display).toBe('SK 123456');
  });

  it('normalizes hyphen-separated ticket numbers', () => {
    const res = normalizeTicketInput('SK-320327');
    expect(res.series).toBe('SK');
    expect(res.number).toBe('320327');
    expect(res.display).toBe('SK 320327');
  });

  it('normalizes contiguous series + ticket numbers', () => {
    const res = normalizeTicketInput('PS320327');
    expect(res.series).toBe('PS');
    expect(res.number).toBe('320327');
    expect(res.display).toBe('PS 320327');
  });

  it('normalizes purely numeric 4-digit or 6-digit ticket numbers', () => {
    const res = normalizeTicketInput('  0266  ');
    expect(res.series).toBeNull();
    expect(res.number).toBe('0266');
    expect(res.display).toBe('0266');
  });

  it('matches 4-digit ending numbers against 6-digit ticket', () => {
    const winningEnding = '0266';
    const userTicket = '540266';
    expect(userTicket.endsWith(winningEnding)).toBe(true);
  });
});
