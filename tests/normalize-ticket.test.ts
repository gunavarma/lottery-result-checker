import { describe, it, expect } from 'vitest';
import { parseTicketCode } from '../lib/lottery/normalize-ticket';

describe('Lottery Ticket Normalization & Code Parser', () => {
  it('parses standard Kerala ticket with series and 6 digits', () => {
    const res1 = parseTicketCode('SK 320327');
    expect(res1.valid).toBe(true);
    expect(res1.ticketNumber).toBe('SK 320327');
    expect(res1.series).toBe('SK');
    expect(res1.number).toBe('320327');
    expect(res1.isFourDigit).toBe(false);

    // Hyphenated and lowercase
    const res2 = parseTicketCode('sk-320327');
    expect(res2.valid).toBe(true);
    expect(res2.ticketNumber).toBe('SK 320327');

    // No space
    const res3 = parseTicketCode('SK320327');
    expect(res3.valid).toBe(true);
    expect(res3.ticketNumber).toBe('SK 320327');
  });

  it('parses 4-digit slips accurately', () => {
    const res = parseTicketCode('0327');
    expect(res.valid).toBe(true);
    expect(res.ticketNumber).toBe('0327');
    expect(res.number).toBe('0327');
    expect(res.isFourDigit).toBe(true);
    expect(res.series).toBeNull();
  });

  it('extracts ticket number from QR URL payloads', () => {
    const res = parseTicketCode('https://www.lotteryagent.kerala.gov.in/result/verify?ticket=SK320327');
    expect(res.valid).toBe(true);
    expect(res.ticketNumber).toBe('SK 320327');
  });

  it('extracts ticket number from JSON QR payloads', () => {
    const res = parseTicketCode('{"ticket":"SK 320327","date":"2026-08-28"}');
    expect(res.valid).toBe(true);
    expect(res.ticketNumber).toBe('SK 320327');
  });

  it('gracefully handles invalid, empty, or garbage input', () => {
    const res1 = parseTicketCode('');
    expect(res1.valid).toBe(false);

    const res2 = parseTicketCode('ABC');
    expect(res2.valid).toBe(false);

    const res3 = parseTicketCode('12');
    expect(res3.valid).toBe(false);
  });
});
