import { describe, it, expect } from 'vitest';
import {
  WinningNumberSchema,
  PrizeSchema,
  ParsedDrawResultSchema,
  HistoryQuerySchema,
  SearchQuerySchema,
} from '../lib/validation/lottery';

describe('Lottery Result Zod Validation', () => {
  it('validates a correct winning number', () => {
    const validTicket = {
      series: 'PS',
      number: '320327',
      displayNumber: 'PS 320327',
      location: 'PATTAMBI',
    };
    const result = WinningNumberSchema.safeParse(validTicket);
    expect(result.success).toBe(true);
  });

  it('rejects an invalid non-digit ticket number', () => {
    const invalidTicket = {
      series: 'PS',
      number: '32032A', // contains letter
      displayNumber: 'PS 32032A',
    };
    const result = WinningNumberSchema.safeParse(invalidTicket);
    expect(result.success).toBe(false);
  });

  it('validates a complete prize tier', () => {
    const validPrize = {
      category: '1st Prize',
      tierNumber: 1,
      amount: 10000000,
      orderIndex: 0,
      winningNumbers: [
        {
          series: 'PS',
          number: '320327',
          displayNumber: 'PS 320327',
        },
      ],
    };
    const result = PrizeSchema.safeParse(validPrize);
    expect(result.success).toBe(true);
  });

  it('rejects a prize tier with empty winning numbers', () => {
    const emptyPrize = {
      category: '1st Prize',
      tierNumber: 1,
      amount: 10000000,
      orderIndex: 0,
      winningNumbers: [], // empty
    };
    const result = PrizeSchema.safeParse(emptyPrize);
    expect(result.success).toBe(false);
  });

  it('validates a full parsed draw result with official LOTIS source URL', () => {
    const validDraw = {
      lotteryName: 'Karunya Plus',
      lotteryCode: 'KN',
      drawNumber: 'KN-638',
      drawDate: new Date('2026-08-27'),
      drawDateFormatted: '2026-08-27',
      drawTime: '3:00 PM',
      venue: 'GORKY BHAVAN',
      sourceUrl: 'https://www.lotteryagent.kerala.gov.in/result/public',
      sourceDocumentUrl: 'https://www.lotteryagent.kerala.gov.in/results/bd338e1c-7f7f-87ad-9b10-273ee368336e',
      prizes: [
        {
          category: '1st Prize',
          tierNumber: 1,
          amount: 10000000,
          orderIndex: 0,
          winningNumbers: [
            {
              series: 'PS',
              number: '320327',
              displayNumber: 'PS 320327',
            },
          ],
        },
      ],
      totalWinningNumbers: 1,
      rawText: 'KERALA STATE LOTTERIES OFFICIAL RESULT DOCUMENT VALID SAMPLE TEXT AT LEAST 50 CHARS',
    };
    const result = ParsedDrawResultSchema.safeParse(validDraw);
    expect(result.success).toBe(true);
  });

  it('validates search query parameters', () => {
    expect(SearchQuerySchema.safeParse({ q: 'KN-638' }).success).toBe(true);
    expect(SearchQuerySchema.safeParse({ q: '' }).success).toBe(false);
    expect(HistoryQuerySchema.safeParse({ page: '2', limit: '10' }).success).toBe(true);
  });
});
