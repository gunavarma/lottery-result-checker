import { describe, it, expect } from 'vitest';
import { isValidDateFormat, parseDateOnlyUtc, formatDateOnly, getIstDateRange } from '../lib/date';
import { parseLotisPdfText } from '../lib/parser/lotis-parser';
import { normalizeTicketInput } from '../app/api/tickets/check/route';

describe('Historical Dates & Automated Result Synchronization', () => {
  it('validates strictly formatted YYYY-MM-DD strings', () => {
    expect(isValidDateFormat('2026-08-29')).toBe(true);
    expect(isValidDateFormat('2026-05-26')).toBe(true);
    expect(isValidDateFormat('2026-13-01')).toBe(false); // invalid month
    expect(isValidDateFormat('2026-08-32')).toBe(false); // invalid day
    expect(isValidDateFormat('29-08-2026')).toBe(false); // wrong order
    expect(isValidDateFormat('')).toBe(false);
  });

  it('converts calendar date to UTC midnight without day shifts', () => {
    const d = parseDateOnlyUtc('2026-08-29');
    expect(d.toISOString()).toBe('2026-08-29T00:00:00.000Z');
    expect(formatDateOnly(d)).toBe('2026-08-29');

    const d2 = parseDateOnlyUtc('2026-08-28');
    expect(d2.toISOString()).toBe('2026-08-28T00:00:00.000Z');
    expect(formatDateOnly(d2)).toBe('2026-08-28');
  });

  it('preserves calendar date from official Kerala LOTIS result document', () => {
    const sampleOfficialText = `
KERALA STATE LOTTERIES - RESULT
KARUNYA LOTTERY NO.KR-766th DRAW held on:- 29/08/2026,3:00 PM
AT GORKY BHAVAN, NEAR BAKERY JUNCTION, THIRUVANANTHAPURAM
1st Prize Rs :10000000/- 1) KB 192899 (KOLLAM)
Cons Prize-Rs :5000/- KA 192899 KC 192899
4th Prize-Rs :5000/- 0329 1143
    `;

    const parsed = parseLotisPdfText(sampleOfficialText);
    expect(parsed).not.toBeNull();
    expect(parsed!.drawNumber).toBe('KR-766');
    expect(parsed!.drawDateFormatted).toBe('2026-08-29');
    expect(parsed!.drawDate.toISOString()).toBe('2026-08-29T00:00:00.000Z');
    expect(parsed!.lotteryName).toBe('Karunya');
    expect(parsed!.prizes.length).toBeGreaterThan(0);
  });

  it('normalizes ticket input variants for indexed seek matching', () => {
    const t1 = normalizeTicketInput('kb 192899');
    expect(t1.series).toBe('KB');
    expect(t1.number).toBe('192899');
    expect(t1.display).toBe('KB 192899');

    const t2 = normalizeTicketInput('KB-192899');
    expect(t2.series).toBe('KB');
    expect(t2.number).toBe('192899');

    const t3 = normalizeTicketInput('0329');
    expect(t3.series).toBeNull();
    expect(t3.number).toBe('0329');
  });

  it('generates consistent IST date range bounds for daily draws', () => {
    const range = getIstDateRange('2026-08-29');
    expect(range.formattedDisplay).toContain('29 August 2026');
    expect(range.istStartUtc.toISOString()).toBe('2026-08-28T18:30:00.000Z');
    expect(range.istEndUtc.toISOString()).toBe('2026-08-29T18:29:59.999Z');
  });
});
