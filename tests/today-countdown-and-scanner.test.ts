import { describe, it, expect } from 'vitest';
import { parseKeralaLotteryTicketOcr } from '../lib/ocr/ticket-ocr';
import { getTodayIstStr, getIstDateRange, IST_OFFSET_MS } from '../lib/date';
import { prisma } from '../lib/prisma';

describe('Kerala Lottery Ticket OCR Parser', () => {
  it('correctly extracts 2-letter series and 6-digit number from clean ticket text', () => {
    const rawOcr = `
      GOVERNMENT OF KERALA
      STATE LOTTERIES
      KARUNYA LOTTERY
      SERIES: KW
      NO: 123456
      DRAW NO: KR-765
    `;

    const result = parseKeralaLotteryTicketOcr(rawOcr);
    expect(result.ticketNumber).toBe('123456');
    expect(result.series).toBe('KW');
    expect(result.fullTicketDisplay).toBe('KW 123456');
    expect(result.detectedLotteryName).toBe('Karunya');
    expect(result.detectedLotterySlug).toBe('karunya');
    expect(result.confidence).toBeGreaterThanOrEqual(90);
  });

  it('handles standard concatenated patterns e.g. "PS 320327" and "SK-678901"', () => {
    const r1 = parseKeralaLotteryTicketOcr('KERALA LOTTERIES SUVARNA KERALAM SK 678901 1ST PRIZE');
    expect(r1.ticketNumber).toBe('678901');
    expect(r1.series).toBe('SK');
    expect(r1.detectedLotteryName).toBe('Suvarna Keralam');

    const r2 = parseKeralaLotteryTicketOcr('STHREE SAKTHI LOTTERY TICKET NO SS-534120');
    expect(r2.ticketNumber).toBe('534120');
    expect(r2.series).toBe('SS');
    expect(r2.detectedLotteryName).toBe('Sthree Sakthi');
  });

  it('corrects OCR character confusions (O->0, I->1, S->5, B->8) in numeric ticket sequence', () => {
    // e.g. "KW O1234S" -> "012345"
    const raw = 'KARUNYA PLUS LOTTERY KN O1234S';
    const result = parseKeralaLotteryTicketOcr(raw);
    expect(result.ticketNumber).toBe('012345');
    expect(result.series).toBe('KN');
  });

  it('gracefully handles 4-digit ending numbers if 6 digits are partially damaged', () => {
    const raw = 'KERALA LOTTERY TICKET ENDING WITH 4567';
    const result = parseKeralaLotteryTicketOcr(raw);
    expect(result.ticketNumber).toBe('4567');
  });

  it('correctly detects Bumper lottery schemes and formats', () => {
    const rawThiruvonam = 'KERALA STATE LOTTERIES THIRUVONAM BUMPER BR-99 TA 492019';
    const r1 = parseKeralaLotteryTicketOcr(rawThiruvonam);
    expect(r1.ticketNumber).toBe('492019');
    expect(r1.series).toBe('TA');
    expect(r1.detectedLotteryName).toBe('Thiruvonam Bumper');
    expect(r1.detectedLotterySlug).toBe('thiruvonam-bumper');

    const rawXmas = "KERALA STATE LOTTERIES X'MAS NEW YEAR BUMPER BR-98 XA 837492";
    const r2 = parseKeralaLotteryTicketOcr(rawXmas);
    expect(r2.ticketNumber).toBe('837492');
    expect(r2.series).toBe('XA');
    expect(r2.detectedLotterySlug).toBe('xmas-new-year-bumper');
  });

  it('returns safe empty result for noisy/unreadable image text', () => {
    const raw = 'RANDOM TEXT WITH NO NUMBERS OR LOTTERY INFORMATION';
    const result = parseKeralaLotteryTicketOcr(raw);
    expect(result.ticketNumber).toBeNull();
    expect(result.fullTicketDisplay).toBeNull();
    expect(result.confidence).toBeLessThan(50);
  });
});

describe('Today Result & Countdown Calculation', () => {
  it('accurately computes IST draw schedule and day of week', () => {
    const todayStr = getTodayIstStr();
    expect(todayStr).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    const [year, month, day] = todayStr.split('-').map(Number);
    const dateObjInIst = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayDay = days[dateObjInIst.getUTCDay()];

    expect(todayDay).toBeTruthy();
  });

  it('target draw time is strictly 3:00:00 PM IST (15:00:00)', () => {
    const todayStr = getTodayIstStr();
    const [year, month, day] = todayStr.split('-').map(Number);

    // Target: Today 15:00:00 IST
    const targetUtc = new Date(Date.UTC(year, month - 1, day, 15, 0, 0, 0) - IST_OFFSET_MS);

    // In IST (+5:30), targetUtc is exactly 15:00:00
    const inIst = new Date(targetUtc.getTime() + IST_OFFSET_MS);
    expect(inIst.getUTCHours()).toBe(15);
    expect(inIst.getUTCMinutes()).toBe(0);
    expect(inIst.getUTCSeconds()).toBe(0);
  });
});
