import { parse, isValid } from 'date-fns';

export interface ParsedWinningNumber {
  series: string | null;
  number: string;
  displayNumber: string;
  location: string | null;
}

export interface ParsedPrize {
  category: string;
  tierNumber: number | null;
  description: string | null;
  amount: number;
  orderIndex: number;
  winningNumbers: ParsedWinningNumber[];
}

export interface ParsedDrawResult {
  lotteryName: string;
  lotteryCode: string;
  drawNumber: string;
  drawDate: Date;
  drawDateFormatted: string; // YYYY-MM-DD
  drawTime: string;
  venue: string | null;
  prizes: ParsedPrize[];
  totalWinningNumbers: number;
  rawText: string;
}

/**
 * Standardize lottery scheme slug from name or code
 */
export function getLotterySlug(name: string, code?: string): string {
  const clean = name
    .toLowerCase()
    .replace(/lottery/gi, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  
  if (clean.includes('suvarna')) return 'suvarna-keralam';
  if (clean.includes('sthree') || clean.includes('sakthi')) return 'sthree-sakthi';
  if (clean.includes('karunya-plus') || (code && code.startsWith('KN'))) return 'karunya-plus';
  if (clean.includes('karunya') || (code && code.startsWith('KR'))) return 'karunya';
  if (clean.includes('bhagya') || clean.includes('thara')) return 'bhagya-thara';
  if (clean.includes('dhanalekshmi') || clean.includes('dhana')) return 'dhanalekshmi';
  if (clean.includes('samrudhi')) return 'samrudhi';
  if (clean.includes('fifty') || clean.includes('50-50')) return 'fifty-fifty';
  if (clean.includes('akshaya')) return 'akshaya';
  if (clean.includes('win-win') || clean.includes('winwin')) return 'win-win';
  if (clean.includes('nirmal')) return 'nirmal';
  if (clean.includes('thiruvonam') || clean.includes('onam')) return 'thiruvonam-bumper';
  if (clean.includes('vishu')) return 'vishu-bumper';
  if (clean.includes('xmas') || clean.includes('new-year') || clean.includes('christmas')) return 'xmas-new-year-bumper';
  if (clean.includes('monsoon')) return 'monsoon-bumper';
  if (clean.includes('pooja')) return 'pooja-bumper';
  if (clean.includes('summer')) return 'summer-bumper';

  return clean || 'kerala-lottery';
}

/**
 * Standardize Kerala Lottery Name casing
 */
export function standardizeLotteryName(rawName: string): string {
  const upper = rawName.toUpperCase().replace(/\s+/g, ' ').trim();
  if (upper.includes('SUVARNA')) return 'Suvarna Keralam';
  if (upper.includes('STHREE') || upper.includes('SAKTHI')) return 'Sthree Sakthi';
  if (upper.includes('KARUNYA PLUS')) return 'Karunya Plus';
  if (upper.includes('KARUNYA')) return 'Karunya';
  if (upper.includes('BHAGYATHARA') || upper.includes('BHAGYA')) return 'Bhagya Thara';
  if (upper.includes('DHANALEKSHMI') || upper.includes('DHANA')) return 'Dhanalekshmi';
  if (upper.includes('SAMRUDHI')) return 'Samrudhi';
  if (upper.includes('FIFTY') || upper.includes('50-50')) return 'Fifty-Fifty';
  if (upper.includes('AKSHAYA')) return 'Akshaya';
  if (upper.includes('WIN-WIN') || upper.includes('WIN WIN')) return 'Win-Win';
  if (upper.includes('NIRMAL')) return 'Nirmal';
  if (upper.includes('THIRUVONAM') || upper.includes('ONAM')) return 'Thiruvonam Bumper';
  if (upper.includes('VISHU')) return 'Vishu Bumper';
  if (upper.includes('XMAS') || upper.includes('CHRISTMAS') || upper.includes('NEW YEAR')) return 'Xmas New Year Bumper';
  if (upper.includes('MONSOON')) return 'Monsoon Bumper';
  if (upper.includes('POOJA')) return 'Pooja Bumper';
  if (upper.includes('SUMMER')) return 'Summer Bumper';

  return rawName.charAt(0).toUpperCase() + rawName.slice(1).toLowerCase();
}

/**
 * Robust line-by-line parser for LOTIS result PDF documents
 */
export function parseLotisPdfText(fullText: string): ParsedDrawResult | null {
  if (!fullText || fullText.trim().length < 50) {
    return null;
  }

  const lines = fullText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  let lotteryName = '';
  let drawNumber = '';
  let lotteryCode = '';
  let drawDate: Date = new Date();
  let drawTime = '3:00 PM';
  let venue: string | null = null;

  // 1. Scan Header Lines
  for (let i = 0; i < Math.min(lines.length, 15); i++) {
    const line = lines[i];

    const headerMatch = line.match(
      /([A-Z0-9\s'-]+?)\s+LOTTERY\s+NO\.?\s*([A-Z0-9-]+?)(?:th|st|nd|rd)?\s+DRAW\s+held\s+on\s*[:-]+\s*([0-9]{1,2}[/-][0-9]{1,2}[/-][0-9]{4})(?:,\s*([0-9:]+\s*[APMapm]+))?/i
    );

    if (headerMatch) {
      lotteryName = headerMatch[1].trim();
      drawNumber = headerMatch[2].trim();
      const dateStr = headerMatch[3].trim().replace(/\//g, '-');
      if (headerMatch[4]) {
        drawTime = headerMatch[4].trim();
      }
      const parsedDate = parse(dateStr, 'dd-MM-yyyy', new Date());
      if (isValid(parsedDate)) {
        drawDate = parsedDate;
      }
    }

    if (line.startsWith('AT ') && !venue) {
      venue = line.replace(/^AT\s+/i, '').replace(/Directorate.*/i, '').trim();
    }
  }

  if (drawNumber) {
    const codeMatch = drawNumber.match(/^([A-Z0-9]+)/i);
    if (codeMatch) lotteryCode = codeMatch[1].toUpperCase();
  }

  if (!lotteryName || !drawNumber) {
    const mName = fullText.match(/([A-Z\s'-]{3,30})\s+LOTTERY/i);
    const mDraw = fullText.match(/NO\.?\s*([A-Z0-9-]{3,15})/i);
    const mDate = fullText.match(/(\d{2}[/-]\d{2}[/-]\d{4})/);
    if (mName) lotteryName = mName[1].trim();
    if (mDraw) drawNumber = mDraw[1].trim();
    if (mDate) {
      const pDate = parse(mDate[1].replace(/\//g, '-'), 'dd-MM-yyyy', new Date());
      if (isValid(pDate)) drawDate = pDate;
    }
  }

  if (!lotteryName || !drawNumber) {
    return null;
  }

  // 2. Parse Prize Sections with Line-by-Line State Machine
  const prizes: ParsedPrize[] = [];
  let currentPrize: {
    category: string;
    tierNumber: number | null;
    description: string | null;
    amount: number;
    winningNumbers: ParsedWinningNumber[];
  } | null = null;

  const prizeHeaderPattern = /^(?:FOR THE TICKETS ENDING WITH THE FOLLOWING NUMBERS\s+)?(1st\s+Prize|2nd\s+Prize|3rd\s+Prize|4th\s+Prize|5th\s+Prize|6th\s+Prize|7th\s+Prize|8th\s+Prize|9th\s+Prize|10th\s+Prize|Cons(?:olation)?\s+Prize|[A-Za-z0-9\s'-]+Prize)(?:-Rs\s*:\s*|\s+Rs\s*:\s*|\s*:\s*Rs\.?\s*|\s*Rs\.?\s*)([0-9,]+)?\/-?(.*)$/i;

  const flushCurrentPrize = () => {
    if (currentPrize && currentPrize.winningNumbers.length > 0) {
      prizes.push({
        category: currentPrize.category,
        tierNumber: currentPrize.tierNumber,
        description: currentPrize.description,
        amount: currentPrize.amount,
        orderIndex: prizes.length,
        winningNumbers: currentPrize.winningNumbers,
      });
      currentPrize = null;
    }
  };

  for (const line of lines) {
    // Ignore footer lines
    if (
      line.startsWith('Page ') ||
      line.startsWith('-- ') ||
      line.includes('Modernization & IT Software Division') ||
      line.includes('The prize winners are advised') ||
      line.includes('Directorate Of State Lotteries') ||
      line.includes('PHONE:-') ||
      line.includes('EMAIL:-') ||
      line.includes('held on:-') ||
      line.startsWith('AT GORKY') ||
      line.startsWith('Sd/-') ||
      line.startsWith('Deputy Director') ||
      line.startsWith('Joint Director')
    ) {
      continue;
    }

    const prizeMatch = line.match(prizeHeaderPattern);

    if (prizeMatch) {
      flushCurrentPrize();

      let categoryName = prizeMatch[1].trim();
      if (/^cons/i.test(categoryName)) {
        categoryName = 'Consolation Prize';
      } else {
        categoryName = categoryName
          .replace(/([0-9]+)(st|nd|rd|th)/i, '$1$2')
          .replace(/\s+/g, ' ')
          .trim();
      }

      const tierMatch = categoryName.match(/^([0-9]+)(?:st|nd|rd|th)/i);
      const tierNumber = tierMatch ? parseInt(tierMatch[1], 10) : null;
      const amount = prizeMatch[2] ? parseInt(prizeMatch[2].replace(/,/g, ''), 10) : 0;
      const restOfLine = prizeMatch[3] ? prizeMatch[3].trim() : '';

      currentPrize = {
        category: categoryName,
        tierNumber,
        description: tierNumber && tierNumber >= 4 ? 'FOR TICKETS ENDING WITH THE FOLLOWING NUMBERS' : null,
        amount,
        winningNumbers: [],
      };

      if (restOfLine) {
        parseLineWinningNumbers(restOfLine, currentPrize.winningNumbers);
      }
    } else if (currentPrize) {
      if (line === 'FOR THE TICKETS ENDING WITH THE FOLLOWING NUMBERS') {
        currentPrize.description = line;
        continue;
      }
      parseLineWinningNumbers(line, currentPrize.winningNumbers);
    }
  }

  flushCurrentPrize();

  const totalWinningNumbers = prizes.reduce((acc, p) => acc + p.winningNumbers.length, 0);

  if (prizes.length === 0 || totalWinningNumbers === 0) {
    return null;
  }

  const year = drawDate.getFullYear();
  const month = String(drawDate.getMonth() + 1).padStart(2, '0');
  const day = String(drawDate.getDate()).padStart(2, '0');
  const drawDateFormatted = `${year}-${month}-${day}`;

  return {
    lotteryName: standardizeLotteryName(lotteryName),
    lotteryCode: lotteryCode || 'KL',
    drawNumber,
    drawDate,
    drawDateFormatted,
    drawTime,
    venue,
    prizes,
    totalWinningNumbers,
    rawText: fullText,
  };
}

/**
 * Helper to extract series tickets or 4-digit numbers from a single line
 */
function parseLineWinningNumbers(line: string, list: ParsedWinningNumber[]) {
  // Check for series tickets e.g. "PS 320327 (PATTAMBI)", "1) PS 320327", "PN 320327"
  const seriesRegex = /(?:[0-9]+\)\s*)?([A-Z]{2})\s+([0-9]{6})(?:\s*\(([^)]+)\))?/g;
  let sMatch: RegExpExecArray | null;
  let hasSeries = false;

  while ((sMatch = seriesRegex.exec(line)) !== null) {
    hasSeries = true;
    const series = sMatch[1].toUpperCase();
    const number = sMatch[2];
    const location = sMatch[3] ? sMatch[3].trim() : null;
    list.push({
      series,
      number,
      displayNumber: `${series} ${number}`,
      location,
    });
  }

  // If no series matches found, extract space-separated 4 to 6 digit numbers
  if (!hasSeries) {
    const numTokens = line.match(/\b[0-9]{4,6}\b/g);
    if (numTokens) {
      for (const num of numTokens) {
        list.push({
          series: null,
          number: num,
          displayNumber: num,
          location: null,
        });
      }
    }
  }
}
