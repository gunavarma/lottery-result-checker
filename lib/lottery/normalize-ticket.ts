/**
 * Ticket Normalization & Parsing Engine for Kerala Lottery Tickets
 * Handles QR payloads, 1D barcodes, 4-digit slips, and varied text representations.
 */

export interface ParsedTicket {
  ticketNumber: string; // Clean display/search string e.g. "SK 320327" or "0327"
  rawValue: string;     // Original scanner output
  format?: string;      // e.g. "QR_CODE", "CODE_128", "MANUAL_4DIGIT"
  valid: boolean;
  series: string | null;
  number: string;       // Digit string
  isFourDigit: boolean;
  reason?: string;
}

/**
 * Parses any raw scanner string or manual input into a structured, validated ticket.
 */
export function parseTicketCode(rawValue: string, detectedFormat?: string): ParsedTicket {
  if (!rawValue || typeof rawValue !== 'string') {
    return {
      ticketNumber: '',
      rawValue: rawValue || '',
      format: detectedFormat,
      valid: false,
      series: null,
      number: '',
      isFourDigit: false,
      reason: 'Empty input',
    };
  }

  let cleaned = rawValue.trim();

  // 1. Check if raw payload is a URL (common in QR codes)
  if (cleaned.startsWith('http://') || cleaned.startsWith('https://')) {
    try {
      const url = new URL(cleaned);
      // Look for query params like ?ticket=, ?t=, ?number=, ?num=
      const ticketParam =
        url.searchParams.get('ticket') ||
        url.searchParams.get('t') ||
        url.searchParams.get('number') ||
        url.searchParams.get('num') ||
        url.searchParams.get('code');

      if (ticketParam) {
        cleaned = ticketParam;
      } else {
        // Last pathname segment
        const segments = url.pathname.split('/').filter(Boolean);
        const last = segments[segments.length - 1];
        if (last && last.length >= 4 && last.length <= 15) {
          cleaned = last;
        }
      }
    } catch {
      // Ignore URL parse error, proceed with cleaned string
    }
  }

  // 2. Check if raw payload is JSON
  if (cleaned.startsWith('{') && cleaned.endsWith('}')) {
    try {
      const json = JSON.parse(cleaned);
      const val =
        json.ticket ||
        json.ticketNumber ||
        json.number ||
        json.num ||
        json.code;
      if (typeof val === 'string') {
        cleaned = val;
      }
    } catch {
      // Not valid JSON, continue
    }
  }

  // 3. Normalize whitespace, hyphens, and delimiters
  // Replace hyphens, underscores, slashes, tabs, and newlines with spaces
  const normalizedStr = cleaned
    .replace(/[\r\n\t\-_/|,:]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // 4. Pattern A: 2 or 3 letter Series + 6-digit number (e.g. "SK 320327", "SK320327", "wa 458921")
  const fullSeriesMatch = normalizedStr.match(/^([A-Za-z]{1,3})\s*(\d{6})$/);
  if (fullSeriesMatch) {
    const series = fullSeriesMatch[1].toUpperCase();
    const number = fullSeriesMatch[2];
    return {
      ticketNumber: `${series} ${number}`,
      rawValue,
      format: detectedFormat || 'SERIES_6DIGIT',
      valid: true,
      series,
      number,
      isFourDigit: false,
    };
  }

  // Pattern B: Series + shorter/longer digit sequence (3 to 6 digits)
  const flexibleSeriesMatch = normalizedStr.match(/^([A-Za-z]{1,3})\s*(\d{4,8})$/);
  if (flexibleSeriesMatch) {
    const series = flexibleSeriesMatch[1].toUpperCase();
    const number = flexibleSeriesMatch[2];
    return {
      ticketNumber: `${series} ${number}`,
      rawValue,
      format: detectedFormat || 'SERIES_FLEXIBLE',
      valid: true,
      series,
      number,
      isFourDigit: number.length === 4,
    };
  }

  // Pattern C: Exact 4-digit number (4-digit slip or ending prize tier)
  const fourDigitMatch = normalizedStr.match(/^\d{4}$/);
  if (fourDigitMatch) {
    const number = fourDigitMatch[0];
    return {
      ticketNumber: number,
      rawValue,
      format: detectedFormat || '4_DIGIT_SLIP',
      valid: true,
      series: null,
      number,
      isFourDigit: true,
    };
  }

  // Pattern D: 6-digit pure number (e.g. "320327")
  const sixDigitMatch = normalizedStr.match(/^\d{6}$/);
  if (sixDigitMatch) {
    const number = sixDigitMatch[0];
    return {
      ticketNumber: number,
      rawValue,
      format: detectedFormat || '6_DIGIT',
      valid: true,
      series: null,
      number,
      isFourDigit: false,
    };
  }

  // Pattern E: Embedded sequence inside longer barcode (extract last 6 digits or series+number)
  const embeddedMatch = normalizedStr.match(/([A-Za-z]{1,3})\s*(\d{6})/);
  if (embeddedMatch) {
    const series = embeddedMatch[1].toUpperCase();
    const number = embeddedMatch[2];
    return {
      ticketNumber: `${series} ${number}`,
      rawValue,
      format: detectedFormat || 'EMBEDDED_EXTRACTED',
      valid: true,
      series,
      number,
      isFourDigit: false,
    };
  }

  // Pattern F: Pure digits between 4 and 8 characters
  const digitsOnly = normalizedStr.replace(/\D/g, '');
  if (digitsOnly.length >= 4 && digitsOnly.length <= 8) {
    return {
      ticketNumber: digitsOnly,
      rawValue,
      format: detectedFormat || 'DIGITS_FALLBACK',
      valid: true,
      series: null,
      number: digitsOnly,
      isFourDigit: digitsOnly.length === 4,
    };
  }

  // Invalid format
  return {
    ticketNumber: normalizedStr,
    rawValue,
    format: detectedFormat,
    valid: false,
    series: null,
    number: digitsOnly,
    isFourDigit: false,
    reason: 'Ticket number must be 4 to 8 digits or 2-letter series with 6 digits (e.g. "SK 320327" or "0327")',
  };
}
