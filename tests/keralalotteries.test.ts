import { describe, it, expect } from 'vitest';
import {
  htmlToText,
  parseKeralaLotteriesHtml,
  inspectKeralaLotteriesPage,
  decodeEntities,
  resolveLotteryName,
} from '@/lib/sources/keralalotteries/parser';
import { getLotterySlug } from '@/lib/parser/lotis-parser';
import {
  parseDrawPageRefs,
  toDrawPageRef,
  extractCandidateUrls,
} from '@/lib/sources/keralalotteries/client';

/**
 * Fixtures mirror the real keralalotteries.net page text (verified against the
 * live KR-768 page), so these tests exercise the actual publication format.
 */

const COMPLETE_RESULT_HTML = `
<html><head><style>.x{color:red}</style><script>var ad = 1;</script></head>
<body>
<div>Kerala Lotteries Results: 12-09-2026 Karunya Lottery Result KR-768 ~ LIVE | Kerala Lottery Result 13.09.2026 Samrudhi SM-72 Results Today</div>
<h1>Kerala State Lotteries Results Official</h1>
<div>Today Karunya Lottery Result 12 -09-2026</div>
<p>KERALA LOTTERY TODAY RESULT</p>
<div>Date of Draw: 12 /09/2026 Karunya Lottery Result KR-768</div>
<div>Today LIVE Kerala Lottery Result</div>
<div>Today Lottery Series: KA, KB, KC, KD, KE, KF, KG, KH, KJ, KK, KL, KM</div>
<div>Kerala Lottery Date of Draw: 11/09/2026 Karunya Lottery Result KR-767 Winners Numbers</div>
<table>
<tr><td>1st Prize : &#8377;1,00,00,000/- [1 Crore]</td></tr>
<tr><td>(Common to all series)</td></tr>
<tr><td>KJ 734269 (PATTAMBI)</td></tr>
<tr><td>Agent Name: V J SANOJ</td></tr>
<tr><td>Agency No.: P 2081</td></tr>
<tr><td>Consolation Prize &#8377;5,000/-</td></tr>
<tr><td>(Remaining all series)</td></tr>
<tr><td>KA 734269</td><td>KB 734269</td><td>KC 734269</td></tr>
<tr><td>KD 734269</td><td>KE 734269</td><td>KF 734269</td></tr>
<tr><td>KG 734269</td><td>KH 734269</td><td>KK 734269</td></tr>
<tr><td>KL 734269</td><td>KM 734269</td></tr>
<tr><td>2nd Prize &#8377;25,00,000/- [25 Lakhs]</td></tr>
<tr><td>(Common to all series)</td></tr>
<tr><td>KJ 236813 (IDUKKI)</td></tr>
<tr><td>3rd Prize &#8377;10,00,000/- [10 Lakhs]</td></tr>
<tr><td>(Common to all series)</td></tr>
<tr><td>KF 521195 (CHERTHALA)</td></tr>
<tr><td>For the tickets ending with the following numbers</td></tr>
<tr><td>4th Prize: &#8377;5,000/-</td></tr>
<tr><td>(Last four digits to be drawn 19 times)</td></tr>
<tr><td>0407 1087 1557 1913 3656 4176 4520 4985 5163 5628 6025 6257 6378 6648 6842 7573 7899 8244 8819</td></tr>
<tr><td>5th Prize: &#8377;2,000/-</td></tr>
<tr><td>(Last four digits to be drawn 6 times)</td></tr>
<tr><td>0736 2520 2886 5196 5549 5572</td></tr>
<tr><td>6th Prize &#8377;1,000/-</td></tr>
<tr><td>(Last four digits to be drawn 25 times)</td></tr>
<tr><td>1555 1579 1644 1760 1849 1879 2321 3413 3510 4051 6102 6188 6525 6661 7135 7482 7721 7970 8298 8802 8880 9122 9362 9710 9801</td></tr>
<tr><td>7th Prize &#8377;500/-</td></tr>
<tr><td>(Last four digits to be drawn 76 times)</td></tr>
<tr><td>0144 0303 0317 0664 0691 0796 0867 0910 0952 0993 1017 1146 1283 1285 1322 1480 1682 1699 1802 1957 2001 2018 2235 2242 2391 2497 2572 2739 2847 2869 2941 3067 3419 3439 3768 3947 4185 4304 4373 4538 4568 4664 4723 4944 5641 5839 5856 5862 6072 6227 6396 6575 6893 6942 7012 7049 7418 7456 7460 8385 8479 8557 8657 8684 8769 8859 9030 9228 9348 9352 9411 9428 9626 9733 9864 9988</td></tr>
<tr><td>8th Prize &#8377;200/-</td></tr>
<tr><td>(Last four digits to be drawn 92 times)</td></tr>
<tr><td>0018 0113 0119 0203 0290 0305 0354 0631 0718 0738 0742 0752 0917 1218 1224 1392 1427 1636 1965 2164 2334 2364 2407 2522 2770 2964 2984 3050 3104 3326 3587 3593 3728 4016 4286 4552 4599 4637 4756 4863 5100 5121 5169 5352 5513 5592 5752 5822 5874 6064 6116 6332 6751 6764 6779 6831 6879 6889 7045 7082 7275 7303 7314 7409 7472 7689 7908 7956 7979 8165 8188 8375 8412 8419 8457 8518 8531 8577 8598 8992 9080 9236 9238 9439 9469 9589 9762 9812 9840 9875 9966 9969</td></tr>
<tr><td>9th Prize &#8377;100/-</td></tr>
<tr><td>(Last four digits to be drawn 144 times)</td></tr>
<tr><td>0052 0222 0251 0296 0514 0573 0580 0676 0696 0717 0902 0980 1011 1100 1148 1246 1258 1361 1373 1516 1640 1696 1765 2019 2109 2152 2201 2228 2265 2307 2390 2409 2433 2439 2755 2823 2965 3156 3174 3192 3196 3256 3257 3296 3300 3384 3398 3483 3530 3564 3594 3606 3695 3746 3817 3844 3883 3908 4030 4201 4219 4244 4300 4418 4439 4456 4510 4739 4857 4922 4933 5079 5089 5264 5293 5306 5411 5491 5525 5630 5712 6108 6231 6243 6253 6317 6347 6536 6573 6591 6599 6607 6674 6717 6895 6949 7025 7067 7113 7115 7129 7351 7515 7568 7579 7696 7748 7817 7836 7904 7913 8179 8280 8308 8416 8440 8445 8543 8627 8641 8752 8776 8809 8888 8959 8962 8979 8984 9023 9061 9178 9182 9274 9366 9393 9530 9591 9667 9707 9728 9777 9802 9891 9941</td></tr>
</table>
<p>The prize winners are advised to verify the winning numbers with the results published in the Kerala Government Gazette and surrender the winning tickets within 90 days.</p>
<p>The prize distribution for the Kerala Lottery Result Today is 1st Prize: &#8377;1,00,00,000/-, Consolation Prize: &#8377;5,000/-, 2nd Prize: &#8377;25,00,000/-, 3rd Prize: &#8377;5,00,000/-, 4th Prize: &#8377;5,000/-, 5th Prize: &#8377;2,000/-, 6th Prize: &#8377;1,000/-, 7th Prize: &#8377;500/-, 8th Prize: &#8377;200/-, 9th Prize: &#8377;100/-. Kerala lottery tax deduction is 30 % of the total amount.</p>
</body></html>
`;

/**
 * A pre-draw page: it advertises the draw and shows the prize-structure block
 * but has no winning numbers yet. The stray "2026" is exactly the kind of
 * 4-digit value that must never be mistaken for a winning number.
 */
const PRE_DRAW_HTML = `
<html><body>
<div>Kerala Lotteries Results: 13-09-2026 Samrudhi Lottery Result SM-72</div>
<div>Kerala Lottery Result Today</div>
<div>Date of Draw: 13 /09/2026 Samrudhi Lottery Result SM-72</div>
<div>Today LIVE Kerala Lottery Result</div>
<div>Today Lottery Series: MN, MO, MP, MR, MS, MT, MU, MV, MW, MX, MY, MZ</div>
<div>Kerala Lottery Result Today 13-09-2026: Samrudhi SM 72 Prize Details</div>
<div>Samrudhi Lottery Prize Structure 2026</div>
<div>1st Prize &#8377; 1,00,00,000/-</div>
<div>4th Prize &#8377; 5,000/-</div>
<div>(Last four digits to be drawn 19 times)</div>
<div>2026</div>
<div>The draw proceedings begin at 3:00 PM at Gorky Bhavan, Thiruvananthapuram.</div>
</body></html>
`;

const PARTIAL_LIVE_HTML = `
<html><body>
<div>Kerala Lottery Result Today 13-09-2026</div>
<div>Date of Draw: 13/09/2026 Samrudhi Lottery Result SM-72</div>
<div>1st Prize : &#8377;1,00,00,000/- [1 Crore]</div>
<div>(Common to all series)</div>
<div>SK 445566 (KANNUR)</div>
<div>Results for other prizes will be updated shortly.</div>
</body></html>
`;

describe('keralalotteries.net parser', () => {
  it('strips scripts/styles and decodes entities into normalised text', () => {
    const text = htmlToText(COMPLETE_RESULT_HTML);

    expect(text).not.toContain('var ad = 1');
    expect(text).not.toContain('<td>');
    expect(text).toContain('₹1,00,00,000');
    expect(decodeEntities('&amp;&#8377;&nbsp;')).toBe('&₹ ');
  });

  it('extracts a complete weekly result with all tiers and winning numbers', () => {
    const result = parseKeralaLotteriesHtml(COMPLETE_RESULT_HTML, {
      sourceUrl: 'https://www.keralalotteries.net/example.html',
    });

    expect(result).not.toBeNull();
    const { parsed, tierCount, isComplete } = result!;

    expect(parsed.lotteryName).toBe('Karunya');
    expect(parsed.lotteryCode).toBe('KR');
    expect(parsed.drawNumber).toBe('KR-768');
    expect(parsed.drawDateFormatted).toBe('2026-09-12');
    expect(tierCount).toBe(10);
    expect(isComplete).toBe(true);

    const first = parsed.prizes.find((p) => p.tierNumber === 1)!;
    expect(first.amount).toBe(10000000);
    expect(first.winningNumbers).toHaveLength(1);
    expect(first.winningNumbers[0].displayNumber).toBe('KJ 734269');
    expect(first.winningNumbers[0].location).toBe('PATTAMBI');

    const consolation = parsed.prizes.find((p) => p.category === 'Consolation Prize')!;
    expect(consolation.amount).toBe(5000);
    expect(consolation.winningNumbers).toHaveLength(11);

    const fourth = parsed.prizes.find((p) => p.tierNumber === 4)!;
    expect(fourth.amount).toBe(5000);
    expect(fourth.winningNumbers).toHaveLength(19);
    expect(fourth.winningNumbers[0].number).toBe('0407');

    const seventh = parsed.prizes.find((p) => p.tierNumber === 7)!;
    expect(seventh.winningNumbers).toHaveLength(76);
  });

  it('never lets the prose prize-summary paragraph create phantom tiers', () => {
    const result = parseKeralaLotteriesHtml(COMPLETE_RESULT_HTML, {
      sourceUrl: 'https://www.keralalotteries.net/example.html',
    })!;

    // "3rd Prize: ₹5,00,000/-" only appears inside the summary sentence; the
    // real 3rd prize tier from the table must win.
    const third = result.parsed.prizes.find((p) => p.tierNumber === 3)!;
    expect(third.amount).toBe(1000000);
  });

  it('parses a partial live update without inventing missing tiers', () => {
    const result = parseKeralaLotteriesHtml(PARTIAL_LIVE_HTML, {
      sourceUrl: 'https://www.keralalotteries.net/live.html',
    });

    expect(result).not.toBeNull();
    expect(result!.tierCount).toBe(1);
    expect(result!.isComplete).toBe(false);
    expect(result!.parsed.drawNumber).toBe('SM-72');
    expect(result!.parsed.prizes[0].winningNumbers[0].displayNumber).toBe('SK 445566');
  });

  it('refuses a pre-draw page instead of fabricating a result from its prize structure', () => {
    const result = parseKeralaLotteriesHtml(PRE_DRAW_HTML, {
      sourceUrl: 'https://www.keralalotteries.net/pre-draw.html',
      expectedDate: '2026-09-13',
      expectedDrawNumber: 'SM-72',
    });

    // The structure block has "1st Prize ₹1,00,00,000" and "4th Prize", and the
    // body contains the year 2026, but there is no 1st-prize series ticket, so
    // nothing may be published.
    expect(result).toBeNull();
  });

  it('classifies a real pre-draw page (ellipsis placeholder) as PRE_DRAW, not a failure', () => {
    // Mirrors the live SM-72 page text before the draw: prize structure is
    // advertised and the winning-number slot holds a literal ellipsis.
    const PREDRAW_PLACEHOLDER_HTML = `
<html><body>
<div>Kerala Lotteries Results: 13-09-2026 Samrudhi Lottery Result SM-72 ~ LIVE</div>
<div>Kerala Lottery Result Live @ 03:00pm</div>
<div>Kerala Lottery Date of Draw: 13/09/2026 Samrudhi SM 72 Winners Numbers</div>
<div>1st Prize Rs.1,00,00,000/- [1 Crore]</div>
<div>(Common to all series)</div>
<div>...</div>
<div>Agent Name:&nbsp;&nbsp;</div>
<div>Agency No.:&nbsp;</div>
<div>Consolation Prize Rs.5,000/-</div>
<div>(Remaining all series)</div>
<div>...</div>
<div>2nd Prize Rs.25,00,000/- [25 Lakhs]</div>
<div>(Common to all series)</div>
<div>...</div>
<div>Tomorrow draw details: Samrudhi SM 72</div>
</body></html>
`;

    const outcome = inspectKeralaLotteriesPage(PREDRAW_PLACEHOLDER_HTML, {
      sourceUrl: 'https://www.keralalotteries.net/pre-draw.html',
      expectedDate: '2026-09-13',
      expectedDrawNumber: 'SM-72',
    });

    expect(outcome.kind).toBe('PRE_DRAW');
    if (outcome.kind === 'PRE_DRAW') {
      expect(outcome.drawDate).toBe('2026-09-13');
      expect(outcome.drawNumber).toBe('SM-72');
    }
    // And it is still not publishable via the plain parser.
    expect(
      parseKeralaLotteriesHtml(PREDRAW_PLACEHOLDER_HTML, {
        sourceUrl: 'https://www.keralalotteries.net/pre-draw.html',
      })
    ).toBeNull();
  });

  it('classifies an unexpected page as UNIDENTIFIED so a format change stays loud', () => {
    // A prize-structure block with no ellipsis placeholder and no winning
    // number: if the source changes its format, this must alert, not go quiet.
    const outcome = inspectKeralaLotteriesPage(PRE_DRAW_HTML, {
      sourceUrl: 'https://www.keralalotteries.net/pre-draw.html',
      expectedDate: '2026-09-13',
      expectedDrawNumber: 'SM-72',
    });

    expect(outcome.kind).toBe('UNIDENTIFIED');

    // Identity mismatches are also UNIDENTIFIED rather than silent.
    const wrongDraw = inspectKeralaLotteriesPage(COMPLETE_RESULT_HTML, {
      sourceUrl: 'https://www.keralalotteries.net/x.html',
      expectedDate: '2026-09-12',
      expectedDrawNumber: 'KR-769',
    });
    expect(wrongDraw.kind).toBe('UNIDENTIFIED');
  });

  it('classifies a complete page as RESULT', () => {
    const outcome = inspectKeralaLotteriesPage(COMPLETE_RESULT_HTML, {
      sourceUrl: 'https://www.keralalotteries.net/x.html',
      expectedDate: '2026-09-12',
      expectedDrawNumber: 'KR-768',
    });

    expect(outcome.kind).toBe('RESULT');
    if (outcome.kind === 'RESULT') {
      expect(outcome.result.parsed.drawNumber).toBe('KR-768');
      expect(outcome.result.isComplete).toBe(true);
    }
  });

  it('returns null for a page that does not identify a draw', () => {
    const result = parseKeralaLotteriesHtml('<html><body>Service unavailable</body></html>', {
      sourceUrl: 'https://www.keralalotteries.net/x.html',
    });
    expect(result).toBeNull();
  });

  it('rejects a page whose identity does not match the requested date or draw', () => {
    const wrongDate = parseKeralaLotteriesHtml(COMPLETE_RESULT_HTML, {
      sourceUrl: 'https://www.keralalotteries.net/x.html',
      expectedDate: '2026-09-13',
    });
    expect(wrongDate).toBeNull();

    const wrongDraw = parseKeralaLotteriesHtml(COMPLETE_RESULT_HTML, {
      sourceUrl: 'https://www.keralalotteries.net/x.html',
      expectedDate: '2026-09-12',
      expectedDrawNumber: 'KR-769',
    });
    expect(wrongDraw).toBeNull();
  });
});

describe('keralalotteries.net draw-page discovery', () => {
  const SITEMAP_XML = `<?xml version="1.0"?><urlset>
    <url><loc>https://www.keralalotteries.net/2026/09/samrudhi-kerala-lottery-result-sm-72-today-13-09-2026.html</loc></url>
    <url><loc>https://www.keralalotteries.net/2026/09/karunya-kerala-lottery-result-kr-768-today-12-09-2026.html</loc></url>
    <url><loc>https://www.keralalotteries.net/2026/08/kerala-lotteries-monthly-results-august-2026.html</loc></url>
    <url><loc>https://www.keralalotteries.net/2018/02/today-kerala-lottery-result-live.html</loc></url>
  </urlset>`;

  it('extracts draw pages and ignores archive/live-hub URLs', () => {
    const refs = parseDrawPageRefs(SITEMAP_XML);

    expect(refs).toHaveLength(2);
    expect(refs.map((r) => r.dateStr).sort()).toEqual(['2026-09-12', '2026-09-13']);
    expect(refs.find((r) => r.dateStr === '2026-09-13')).toMatchObject({
      code: 'SM',
      drawNumber: 'SM-72',
    });
  });

  it('resolves relative hrefs against the source base URL', () => {
    const ref = toDrawPageRef('/2026/09/suvarna-keralam-kerala-lottery-result-sk-69-today-11-09-2026.html');
    expect(ref).toMatchObject({
      dateStr: '2026-09-11',
      drawNumber: 'SK-69',
      url: 'https://www.keralalotteries.net/2026/09/suvarna-keralam-kerala-lottery-result-sk-69-today-11-09-2026.html',
    });
  });

  it('collects anchors, loc entries and raw .html URLs exactly once', () => {
    const html = `<a href="https://a.test/x.html">x</a><a href="https://a.test/x.html">again</a>`;
    const urls = extractCandidateUrls(html);
    expect(urls.filter((u) => u === 'https://a.test/x.html')).toHaveLength(1);
  });

  it('rejects unrelated URLs', () => {
    expect(toDrawPageRef('https://www.keralalotteries.net/about-us.html')).toBeNull();
    expect(toDrawPageRef('/search?q=karunya')).toBeNull();
  });
});

/**
 * Legacy publication format (verified against the real SS-189 and NR-180 pages):
 *   - "Date of Draw" with no colon, sometimes with the code on a later line
 *   - the tier name and its amount on separate lines ("1st Prize-" / "Rs :7,000,000/-")
 *   - the 3rd prize published as 4-digit endings instead of a series ticket
 *   - a "today's draw" widget in the page chrome that names a DIFFERENT draw
 */
const LEGACY_RESULT_HTML = `
<html><body>
<div>Kerala Lottery Results: 24-12-2019 Sthree Sakthi SS-189 Lottery Result ~ LIVE | Kerala Lottery Result 22.09.2026 Sthree Sakthi SS-538 Results Today</div>
<p>Kerala State Lotteries Results</p>
<div>Kerala Lottery Result Sthree Sakthi (SS.189)</div>
<div>Date of Draw 24.12.2019</div>
<div>1st Prize-</div>
<div>Rs :7,000,000/-</div>
<div>SB 726505 (KOLLAM)</div>
<div>----</div>
<div>Consolation Prize-</div>
<div>Rs. 8,000/-</div>
<div>SA 726505 SC 726505</div>
<div>2nd Prize-</div>
<div>Rs :500,000/-</div>
<div>SA 893285 (PALAKKAD)</div>
<div>For The Tickets Ending With</div>
<div>The Following Numbers</div>
<div>3rd Prize-</div>
<div>Rs. 5,000/-</div>
<div>2290 2633 3037 4535</div>
<div>4th Prize-</div>
<div>Rs. 2,000/-</div>
<div>3013 5974 6339 6770</div>
<p>The prize winners are advised to verify the winning numbers with the results published in the Kerala Government Gazette</p>
</body></html>
`;

describe('Legacy publication formats (historical archive)', () => {
  const inspect = (expectedDate: string, expectedDrawNumber: string) =>
    inspectKeralaLotteriesPage(LEGACY_RESULT_HTML, {
      sourceUrl: `https://www.keralalotteries.net/2019/12/sthree-sakthi-${expectedDrawNumber.toLowerCase()}.html`,
      expectedDate,
      expectedDrawNumber,
    });

  it('parses an era whose "Date of Draw" line has no colon and no code', () => {
    const outcome = inspect('2019-12-24', 'SS-189');
    expect(outcome.kind).toBe('RESULT');
    if (outcome.kind !== 'RESULT') return;

    const { parsed, tierCount } = outcome.result;
    expect(parsed.drawNumber).toBe('SS-189');
    expect(parsed.drawDateFormatted).toBe('2019-12-24');
    expect(parsed.lotteryName).toBe('Sthree Sakthi');
    expect(tierCount).toBe(5);
    expect(parsed.prizes[0].winningNumbers[0].displayNumber).toBe('SB 726505');
  });

  it('reads tier amounts published on the line after the tier name', () => {
    const outcome = inspect('2019-12-24', 'SS-189');
    if (outcome.kind !== 'RESULT') throw new Error('expected a parsed result');

    const amounts = Object.fromEntries(
      outcome.result.parsed.prizes.map((prize) => [prize.category, prize.amount])
    );
    expect(amounts['1st Prize']).toBe(7000000);
    expect(amounts['Consolation Prize']).toBe(8000);
    expect(amounts['2nd Prize']).toBe(500000);
    expect(amounts['3rd Prize']).toBe(5000);
  });

  it('accepts 4-digit early tiers only when the line is purely 4-digit groups', () => {
    const outcome = inspect('2019-12-24', 'SS-189');
    if (outcome.kind !== 'RESULT') throw new Error('expected a parsed result');

    const third = outcome.result.parsed.prizes.find((p) => p.category === '3rd Prize');
    expect(third?.winningNumbers.map((w) => w.number)).toEqual([
      '2290',
      '2633',
      '3037',
      '4535',
    ]);
  });

  it('never lets a "today\'s draw" widget in the chrome assert a different draw', () => {
    // The page chrome advertises today's SS-538; the URL says SS-189.
    const mismatched = inspect('2019-12-24', 'SS-538');
    expect(mismatched.kind).toBe('UNIDENTIFIED');

    const wrongDate = inspect('2026-09-22', 'SS-189');
    expect(wrongDate.kind).toBe('UNIDENTIFIED');
  });

  it('reads amounts written as "₹.7000000/-" (2021-era pages)', () => {
    const html = `
<html><body>
<div>Kerala Lotteries Result 01-01-2021 Nirmal Lottery NR-205 ~ LIVE | Kerala Lottery Result 22.09.2026 Sthree Sakthi SS-538 Results Today</div>
<div>1st Prize ₹.7000000/-</div>
<div>NR 673025 (KATTAPPANA)</div>
<div>Consolation Prize ₹.8000/-</div>
<div>NN 673025 NO 673025</div>
<div>2nd Prize ₹.1000000/-</div>
<div>NU 753005 (KARUNAGAPALLY)</div>
<p>The prize winners are advised to verify the winning numbers with the results published in the Kerala Government Gazette</p>
</body></html>`;

    const outcome = inspectKeralaLotteriesPage(html, {
      sourceUrl: 'https://www.keralalotteries.net/2021/01/nr-205.html',
      expectedDate: '2021-01-01',
      expectedDrawNumber: 'NR-205',
    });

    expect(outcome.kind).toBe('RESULT');
    if (outcome.kind !== 'RESULT') return;

    const amounts = Object.fromEntries(
      outcome.result.parsed.prizes.map((prize) => [prize.category, prize.amount])
    );
    expect(amounts['1st Prize']).toBe(7000000);
    expect(amounts['Consolation Prize']).toBe(8000);
    expect(outcome.result.parsed.prizes[0].winningNumbers[0].displayNumber).toBe('NR 673025');
  });

  it('accepts a monthly draw with several 1st prizes without weakening the gate', () => {
    const html = `
<html><body>
<div>Kerala Lottery Results: 03-01-2021 Bhagyamithra BM-2 Lottery Result ~ LIVE | Kerala Lottery Result 22.09.2026 Sthree Sakthi SS-538 Results Today</div>
<div>Kerala Lottery Result Date of Draw: 03/01/2021 Bhagyamithra Lottery Result BM-2</div>
<div>1st Prize Rs.1,00,00,000/- [1 crore]</div>
<div>1) BJ 382963 (KANHANGAD)</div>
<div>2) BK 297436 (PAYYANUR)</div>
<div>3) BM 429076 (MALAPPURAM)</div>
<div>Consolation Prize Rs :25000/-</div>
<div>BK 382963 BL 382963</div>
<div>2nd Prize Rs.500000/-</div>
<div>BJ 297436 (PAYYANUR)</div>
<p>The prize winners are advised to verify the winning numbers with the results published in the Kerala Government Gazette</p>
</body></html>`;

    const outcome = inspectKeralaLotteriesPage(html, {
      sourceUrl: 'https://www.keralalotteries.net/2021/01/bm-2.html',
      expectedDate: '2021-01-03',
      expectedDrawNumber: 'BM-2',
    });

    expect(outcome.kind).toBe('RESULT');
    if (outcome.kind !== 'RESULT') return;

    expect(outcome.result.parsed.lotteryName).toBe('Bhagyamithra');
    const first = outcome.result.parsed.prizes.find((prize) => prize.tierNumber === 1);
    expect(first?.winningNumbers).toHaveLength(3);
    // The monthly scheme awards ₹25,000 in consolation, not the weekly ₹5,000.
    const consolation = outcome.result.parsed.prizes.find(
      (prize) => prize.category === 'Consolation Prize'
    );
    expect(consolation?.amount).toBe(25000);
  });

  it('never derives a draw number from surrounding prose', () => {
    // A case-insensitive code match would read "AW-24" out of "Draw 24.12.2019".
    const outcome = inspect('2019-12-24', 'SS-189');
    if (outcome.kind !== 'RESULT') throw new Error('expected a parsed result');
    expect(outcome.result.parsed.drawNumber).not.toContain('AW');
  });
});

describe('Scheme resolution for historical draws', () => {
  it('maps legacy codes to their canonical scheme names when the page omits the name', () => {
    expect(resolveLotteryName(null, 'RN')).toBe('Pournami');
    expect(resolveLotteryName(null, 'BM')).toBe('Bhagyamithra');
    expect(resolveLotteryName(null, 'NR')).toBe('Nirmal');
    expect(resolveLotteryName(null, 'AK')).toBe('Akshaya');
    expect(resolveLotteryName(null, 'FF')).toBe('Fifty-Fifty');
  });

  it('strips chrome words from headings instead of publishing them as a scheme', () => {
    expect(resolveLotteryName('Today pournami', 'RN')).toBe('pournami');
    expect(resolveLotteryName('Live Karunya', 'KR')).toBe('Karunya');
    // A pure chrome word is not a name, so the code mapping takes over.
    expect(resolveLotteryName('Kerala', 'SS')).toBe('Sthree Sakthi');
    expect(resolveLotteryName('Today', 'ZZ')).toBeNull();
  });

  it('files Bhagyamithra under its own scheme, not Bhagya Thara', () => {
    expect(getLotterySlug('Bhagyamithra', 'BM')).toBe('bhagyamithra');
    expect(getLotterySlug('Bhagya Thara', 'BT')).toBe('bhagya-thara');
    expect(getLotterySlug('Pournami', 'RN')).toBe('pournami');
  });
});
