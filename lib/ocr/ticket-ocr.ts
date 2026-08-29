export interface DetectedTicketResult {
  rawText: string;
  series: string | null;
  ticketNumber: string | null;
  fullTicketDisplay: string | null;
  detectedLotterySlug: string | null;
  detectedLotteryName: string | null;
  confidence: number;
}

const LOTTERY_KEYWORDS: Array<{ name: string; slug: string; code: string; patterns: RegExp[] }> = [
  {
    name: 'Karunya Plus',
    slug: 'karunya-plus',
    code: 'KN',
    patterns: [/KARUNYA\s*PLUS/i, /\bKN\b/i],
  },
  {
    name: 'Karunya',
    slug: 'karunya',
    code: 'KR',
    patterns: [/KARUNYA/i, /\bKR\b/i],
  },
  {
    name: 'Suvarna Keralam',
    slug: 'suvarna-keralam',
    code: 'SK',
    patterns: [/SUVARNA\s*KERALAM/i, /SUVARNA/i, /\bSK\b/i],
  },
  {
    name: 'Sthree Sakthi',
    slug: 'sthree-sakthi',
    code: 'SS',
    patterns: [/STHREE\s*SAKTHI/i, /STHREESAKTHI/i, /\bSS\b/i],
  },
  {
    name: 'Bhagya Thara',
    slug: 'bhagya-thara',
    code: 'BT',
    patterns: [/BHAGYA\s*THARA/i, /BHAGYATHARA/i, /\bBT\b/i],
  },
  {
    name: 'Samrudhi',
    slug: 'samrudhi',
    code: 'SM',
    patterns: [/SAMRUDHI/i, /\bSM\b/i],
  },
  {
    name: 'Dhanalekshmi',
    slug: 'dhanalekshmi',
    code: 'DL',
    patterns: [/DHANALEKSHMI/i, /\bDL\b/i],
  },
  {
    name: 'Fifty-Fifty',
    slug: 'fifty-fifty',
    code: 'FF',
    patterns: [/FIFTY\s*FIFTY/i, /50\s*50/i, /\bFF\b/i],
  },
  {
    name: 'Nirmal',
    slug: 'nirmal',
    code: 'NR',
    patterns: [/NIRMAL/i, /\bNR\b/i],
  },
  {
    name: 'Win-Win',
    slug: 'win-win',
    code: 'W',
    patterns: [/WIN\s*WIN/i, /\bW\b/i],
  },
  {
    name: 'Thiruvonam Bumper',
    slug: 'thiruvonam-bumper',
    code: 'BR-99',
    patterns: [/THIRUVONAM/i, /ONAM\s*BUMPER/i, /\bBR-?99\b/i],
  },
  {
    name: 'Vishu Bumper',
    slug: 'vishu-bumper',
    code: 'BR-109',
    patterns: [/VISHU\s*BUMPER/i, /\bBR-?109\b/i],
  },
  {
    name: 'Pooja Bumper',
    slug: 'pooja-bumper',
    code: 'BR-102',
    patterns: [/POOJA\s*BUMPER/i, /\bBR-?102\b/i],
  },
  {
    name: "X'mas New Year Bumper",
    slug: 'xmas-new-year-bumper',
    code: 'BR-98',
    patterns: [/XMAS/i, /CHRISTMAS/i, /NEW\s*YEAR\s*BUMPER/i, /\bBR-?98\b/i],
  },
];

const NON_SERIES_WORDS = new Set(['NO', 'NR', 'KL', 'TV', 'TH', 'IN', 'OF', 'ON', 'TO', 'AT', 'DT', 'RS', 'RE', 'RD', 'ST', 'ND']);

/**
 * Clean OCR text by fixing common character confusions in numeric zones
 */
function cleanNumericDigits(str: string): string {
  return str
    .replace(/[Oo]/g, '0')
    .replace(/[Il|!]/g, '1')
    .replace(/[Zz]/g, '2')
    .replace(/[Ss]/g, '5')
    .replace(/[Bb]/g, '8')
    .replace(/[Gg]/g, '6')
    .replace(/\D/g, '');
}

/**
 * Parse OCR raw string from Kerala lottery ticket into structured ticket elements
 */
export function parseKeralaLotteryTicketOcr(rawText: string): DetectedTicketResult {
  if (!rawText || rawText.trim().length === 0) {
    return {
      rawText: '',
      series: null,
      ticketNumber: null,
      fullTicketDisplay: null,
      detectedLotterySlug: null,
      detectedLotteryName: null,
      confidence: 0,
    };
  }

  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  let detectedSeries: string | null = null;
  let detectedNumber: string | null = null;
  let detectedLotterySlug: string | null = null;
  let detectedLotteryName: string | null = null;

  // 1. Detect Lottery Scheme
  for (const scheme of LOTTERY_KEYWORDS) {
    for (const p of scheme.patterns) {
      if (p.test(rawText)) {
        detectedLotterySlug = scheme.slug;
        detectedLotteryName = scheme.name;
        break;
      }
    }
    if (detectedLotterySlug) break;
  }

  // 2. Check explicit "SERIES: [A-Z]{2}" label
  const seriesLabelMatch = rawText.match(/SERIES\s*[:.\-]?\s*([A-Za-z]{2})\b/i);
  if (seriesLabelMatch && !NON_SERIES_WORDS.has(seriesLabelMatch[1].toUpperCase())) {
    detectedSeries = seriesLabelMatch[1].toUpperCase();
  }

  // 3. Look for explicit pattern: 2 letters + space/dash + 6 digits (e.g. "KW 123456", "PS-320327", "SK 678901")
  const standardTicketRegex = /\b([A-Za-z]{2})[\s\-.:]+([0-9OlISBb]{6})\b/g;
  let match;
  while ((match = standardTicketRegex.exec(rawText)) !== null) {
    const candidateSeries = match[1].toUpperCase();
    if (!NON_SERIES_WORDS.has(candidateSeries)) {
      if (!detectedSeries) detectedSeries = candidateSeries;
      detectedNumber = cleanNumericDigits(match[2]);
      break;
    } else {
      // Just take digits if series word was "NO"
      detectedNumber = cleanNumericDigits(match[2]);
    }
  }

  // 4. Line by line scan if number not found yet
  if (!detectedNumber) {
    for (const line of lines) {
      const m = line.match(/([A-Za-z]{2})\s*([0-9OlISBb]{6})/i);
      if (m && !NON_SERIES_WORDS.has(m[1].toUpperCase())) {
        if (!detectedSeries) detectedSeries = m[1].toUpperCase();
        detectedNumber = cleanNumericDigits(m[2]);
        break;
      }

      const mDigits = line.match(/\b([0-9]{6})\b/);
      if (mDigits && !detectedNumber) {
        detectedNumber = mDigits[1];
      }

      const mSeries = line.match(/\b([A-Z]{2})\b/);
      if (mSeries && !detectedSeries && !NON_SERIES_WORDS.has(mSeries[1].toUpperCase())) {
        detectedSeries = mSeries[1].toUpperCase();
      }
    }
  }

  // 5. Fallback: Check 4-digit ending numbers if 6 digits not found
  if (!detectedNumber) {
    const m4 = rawText.match(/\b([0-9]{4})\b/);
    if (m4) {
      detectedNumber = m4[1];
    }
  }

  let fullTicketDisplay: string | null = null;
  if (detectedNumber) {
    fullTicketDisplay = detectedSeries ? `${detectedSeries} ${detectedNumber}` : detectedNumber;
  }

  const confidence = detectedNumber && detectedNumber.length >= 4 ? (detectedSeries ? 95 : 75) : 30;

  return {
    rawText,
    series: detectedSeries,
    ticketNumber: detectedNumber,
    fullTicketDisplay,
    detectedLotterySlug,
    detectedLotteryName,
    confidence,
  };
}
