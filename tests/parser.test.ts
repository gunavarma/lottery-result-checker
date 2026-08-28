import { describe, it, expect } from 'vitest';
import { parseLotisPdfText, getLotterySlug, standardizeLotteryName } from '../lib/parser/lotis-parser';

// Official LOTIS text fixture (based on Karunya Plus KN-638 official PDF release)
const OFFICIAL_LOTIS_FIXTURE = `
KERALA STATE LOTTERIES - RESULT
www.statelottery.kerala.gov.in PHONE:- 0471-2305230 DIRECTOR:- 0471-2305193
www.kerala.gov.in OFFICE:- 0471-2301740 EMAIL:- cru.dir.lotteries@kerala.gov.in
KARUNYA PLUS LOTTERY NO.KN-638th DRAW held on:- 27/08/2026,3:00 PM
AT GORKY BHAVAN, NEAR BAKERY JUNCTION, THIRUVANANTHAPURAM
1st Prize Rs :10000000/- 1) PS 320327 (PATTAMBI)
Cons Prize-Rs :5000/- PN 320327 PO 320327 PP 320327 PR 320327 PT 320327
PU 320327 PV 320327 PW 320327 PX 320327 PY 320327
PZ 320327
2nd Prize Rs :3000000/- 1) PO 635731 (MALAPPURAM)
3rd Prize Rs :500000/- 1) PU 134959 (PAYYANUR)
FOR THE TICKETS ENDING WITH THE FOLLOWING NUMBERS
4th Prize-Rs :5000/- 0266 0933 1292 1702 3206
3969 4432 4456 5407 5676
5991 6450 7172 7174 7652
8835 8887 9469 9544
5th Prize-Rs :2000/- 0123 1766 3927 3983 6389
9182
6th Prize-Rs :1000/- 0007 0115 0143 0739 0779
7th Prize-Rs :500/- 0278 0491 0529 0563 0601
8th Prize-Rs :200/- 0026 0164 0217 0349 0479
9th Prize-Rs :100/- 0108 0148 0226 0298 0380
The prize winners are advised to verify the winning numbers with the results published in the Kerala
Government Gazette and surrender the winning tickets within 90 days.
`;

describe('LOTIS Official PDF Parser', () => {
  it('correctly extracts lottery header metadata', () => {
    const result = parseLotisPdfText(OFFICIAL_LOTIS_FIXTURE);
    expect(result).not.toBeNull();
    expect(result?.lotteryName).toBe('Karunya Plus');
    expect(result?.lotteryCode).toBe('KN');
    expect(result?.drawNumber).toBe('KN-638');
    expect(result?.drawDateFormatted).toBe('2026-08-27');
    expect(result?.drawTime).toBe('3:00 PM');
    expect(result?.venue).toContain('GORKY BHAVAN');
  });

  it('correctly parses 1st prize winning ticket and district location', () => {
    const result = parseLotisPdfText(OFFICIAL_LOTIS_FIXTURE);
    const firstPrize = result?.prizes.find((p) => p.tierNumber === 1);
    expect(firstPrize).toBeDefined();
    expect(firstPrize?.amount).toBe(10000000);
    expect(firstPrize?.winningNumbers.length).toBe(1);
    expect(firstPrize?.winningNumbers[0].series).toBe('PS');
    expect(firstPrize?.winningNumbers[0].number).toBe('320327');
    expect(firstPrize?.winningNumbers[0].displayNumber).toBe('PS 320327');
    expect(firstPrize?.winningNumbers[0].location).toBe('PATTAMBI');
  });

  it('correctly parses consolation prize series list', () => {
    const result = parseLotisPdfText(OFFICIAL_LOTIS_FIXTURE);
    const consPrize = result?.prizes.find((p) => p.category === 'Consolation Prize');
    expect(consPrize).toBeDefined();
    expect(consPrize?.amount).toBe(5000);
    expect(consPrize?.winningNumbers.length).toBe(11);
    expect(consPrize?.winningNumbers[0].displayNumber).toBe('PN 320327');
  });

  it('correctly parses lower ending prize numbers', () => {
    const result = parseLotisPdfText(OFFICIAL_LOTIS_FIXTURE);
    const fourthPrize = result?.prizes.find((p) => p.tierNumber === 4);
    expect(fourthPrize).toBeDefined();
    expect(fourthPrize?.amount).toBe(5000);
    expect(fourthPrize?.winningNumbers.length).toBe(19);
    expect(fourthPrize?.winningNumbers[0].displayNumber).toBe('0266');
  });

  it('fails safely and returns null on malformed or empty text', () => {
    expect(parseLotisPdfText('')).toBeNull();
    expect(parseLotisPdfText('Invalid random content with no lottery numbers')).toBeNull();
    expect(parseLotisPdfText('KARUNYA PLUS LOTTERY NO.KN-999 but no prizes')).toBeNull();
  });

  it('correctly standardizes lottery scheme slugs and names', () => {
    expect(getLotterySlug('KARUNYA PLUS LOTTERY', 'KN')).toBe('karunya-plus');
    expect(getLotterySlug('STHREE-SAKTHI', 'SS')).toBe('sthree-sakthi');
    expect(getLotterySlug('THIRUVONAM BUMPER', 'BR-99')).toBe('thiruvonam-bumper');
    expect(standardizeLotteryName('karunya plus lottery')).toBe('Karunya Plus');
    expect(standardizeLotteryName('sthree sakthi')).toBe('Sthree Sakthi');
  });
});
