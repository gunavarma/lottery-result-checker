import { describe, it, expect, vi } from 'vitest';
import { parseTicketCode } from '../lib/lottery/normalize-ticket';
import { checkTicketsHandler } from '../app/api/tickets/check/route';
import { prisma } from '../lib/prisma';

describe('Multi-Ticket Scanner & Batch Verification System', () => {
  it('correctly parses and normalizes diverse ticket formats in a multi-scan batch', () => {
    const rawInputs = [
      'SK 320327',
      'sk-320327',
      '1234',
      'https://www.lotteryagent.kerala.gov.in/result/verify?ticket=WA458921',
      '{"ticket":"FF 892100"}',
      '0327',
    ];

    const parsedResults = rawInputs.map((raw) => parseTicketCode(raw));

    expect(parsedResults[0].ticketNumber).toBe('SK 320327');
    expect(parsedResults[1].ticketNumber).toBe('SK 320327');
    expect(parsedResults[2].ticketNumber).toBe('1234');
    expect(parsedResults[2].isFourDigit).toBe(true);
    expect(parsedResults[3].ticketNumber).toBe('WA 458921');
    expect(parsedResults[4].ticketNumber).toBe('FF 892100');
    expect(parsedResults[5].ticketNumber).toBe('0327');
    expect(parsedResults[5].isFourDigit).toBe(true);

    // Test duplicate detection in batch
    const uniqueTickets = new Set(parsedResults.map((p) => p.ticketNumber));
    expect(uniqueTickets.size).toBe(5); // 'SK 320327' counted once
  });

  it('evaluates batch of tickets against published draw mock and returns structured win/no-win results', async () => {
    // Mock prisma.draw.findMany to return a mock published draw
    const mockDraw = {
      id: 'mock-draw-1',
      drawNumber: 'SK-67',
      drawDate: new Date('2026-08-28T00:00:00.000Z'),
      sourceUrl: 'https://lotteryagent.kerala.gov.in/results/mock-1',
      lottery: {
        id: 'lottery-sk',
        name: 'Suvarna Keralam',
        slug: 'suvarna-keralam',
      },
      prizes: [
        {
          id: 'prize-1',
          category: '1st Prize',
          amount: BigInt(10000000),
          orderIndex: 0,
          winningNumbers: [
            {
              id: 'win-1',
              series: 'SK',
              number: '320327',
              displayNumber: 'SK 320327',
              location: 'Kozhikode',
            },
          ],
        },
        {
          id: 'prize-7',
          category: '7th Prize',
          amount: BigInt(500),
          orderIndex: 6,
          winningNumbers: [
            {
              id: 'win-7-1',
              series: null,
              number: '1234',
              displayNumber: '1234',
              location: null,
            },
          ],
        },
      ],
    };

    vi.spyOn(prisma.draw, 'findMany').mockResolvedValueOnce([mockDraw as any]);

    const batchCheckResult = await checkTicketsHandler({
      tickets: ['SK 320327', '1234', '999999'],
    });

    expect(batchCheckResult.success).toBe(true);
    expect(batchCheckResult.results.length).toBe(3);

    // Ticket 1: 1st Prize Winner
    const t1 = batchCheckResult.results.find((r) => r.inputTicket === 'SK 320327') as any;
    expect(t1?.isMatch).toBe(true);
    expect(t1?.prizeCategory).toBe('1st Prize');
    expect(t1?.prizeAmount).toBe(10000000);

    // Ticket 2: 4-digit slip 7th Prize Winner
    const t2 = batchCheckResult.results.find((r) => r.inputTicket === '1234') as any;
    expect(t2?.isMatch).toBe(true);
    expect(t2?.prizeCategory).toBe('7th Prize');
    expect(t2?.prizeAmount).toBe(500);

    // Ticket 3: Non-winning ticket
    const t3 = batchCheckResult.results.find((r) => r.inputTicket === '999999') as any;
    expect(t3?.isMatch).toBe(false);
    expect(t3?.status).toBe('NO_MATCH');
  });
});
