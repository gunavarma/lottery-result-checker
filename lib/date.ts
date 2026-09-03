import { format } from 'date-fns';
import { prisma } from './prisma';

export const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // +05:30 in milliseconds

/**
 * Validates strictly if a string matches YYYY-MM-DD format
 */
export function isValidDateFormat(dateStr: string): boolean {
  if (!dateStr || typeof dateStr !== 'string') return false;
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return false;
  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  if (year < 1967 || year > 2100) return false; // Kerala lottery began in 1967
  return true;
}

/**
 * Converts a YYYY-MM-DD date string into a Date object at UTC midnight
 * perfectly aligned with PostgreSQL DATE fields.
 */
export function parseDateOnlyUtc(dateStr: string): Date {
  if (!isValidDateFormat(dateStr)) {
    throw new Error(`Invalid date format: "${dateStr}". Expected YYYY-MM-DD.`);
  }
  return new Date(`${dateStr}T00:00:00.000Z`);
}

/**
 * Extracts pure YYYY-MM-DD string from a Date or ISO string without timezone shifts
 */
export function formatDateOnly(date: Date | string): string {
  if (typeof date === 'string') {
    if (isValidDateFormat(date)) return date;
    const d = new Date(date);
    return isNaN(d.getTime()) ? date : d.toISOString().slice(0, 10);
  }
  return date.toISOString().slice(0, 10);
}

/**
 * Converts a YYYY-MM-DD date string into UTC start and end bounds
 * representing exactly 00:00:00.000 to 23:59:59.999 in Asia/Kolkata (IST).
 */
export function getIstDateRange(dateStr: string): { istStartUtc: Date; istEndUtc: Date; formattedDisplay: string } {
  if (!isValidDateFormat(dateStr)) {
    throw new Error(`Invalid date format: "${dateStr}". Expected YYYY-MM-DD.`);
  }

  const [year, month, day] = dateStr.split('-').map(Number);

  // 00:00:00 IST = UTC 00:00:00 - 5h 30m
  const istStartUtc = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0) - IST_OFFSET_MS);
  // 23:59:59.999 IST = UTC 23:59:59.999 - 5h 30m
  const istEndUtc = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999) - IST_OFFSET_MS);

  // Standard readable format in IST
  const dateObj = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const formattedDisplay = `${day} ${months[month - 1]} ${year} (${daysOfWeek[dateObj.getUTCDay()]})`;

  return { istStartUtc, istEndUtc, formattedDisplay };
}

/**
 * Returns today's date in YYYY-MM-DD string according to Asia/Kolkata (IST)
 */
export function getTodayIstStr(): string {
  const now = new Date();
  const istTime = new Date(now.getTime() + IST_OFFSET_MS);
  const year = istTime.getUTCFullYear();
  const month = String(istTime.getUTCMonth() + 1).padStart(2, '0');
  const day = String(istTime.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns yesterday's date in YYYY-MM-DD string according to Asia/Kolkata (IST)
 */
export function getYesterdayIstStr(): string {
  const now = new Date();
  const istTime = new Date(now.getTime() + IST_OFFSET_MS - (24 * 60 * 60 * 1000));
  const year = istTime.getUTCFullYear();
  const month = String(istTime.getUTCMonth() + 1).padStart(2, '0');
  const day = String(istTime.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Converts a database Date or DateTime to IST YYYY-MM-DD string
 */
export function toIstDateStr(date: Date | string): string {
  return formatDateOnly(date);
}

/**
 * Formats a Date object for display
 */
export function formatIstDate(date: Date, formatPattern: string = 'dd MMMM yyyy (EEEE)'): string {
  const dateStr = formatDateOnly(date);
  const [y, m, d] = dateStr.split('-').map(Number);
  const dateObj = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  return format(dateObj, formatPattern);
}

/**
 * Finds adjacent available draw dates from the database relative to a given date string.
 */
export async function getAdjacentAvailableDates(currentDateStr: string): Promise<{
  prevAvailableDate: string | null;
  nextAvailableDate: string | null;
  allAvailableDates: string[];
}> {
  try {
    const targetDate = parseDateOnlyUtc(currentDateStr);

    const [prevDraw, nextDraw, allDraws] = await Promise.all([
      prisma.draw.findFirst({
        where: {
          drawDate: { lt: targetDate },
          status: 'PUBLISHED',
        },
        orderBy: { drawDate: 'desc' },
        select: { drawDate: true },
      }),
      prisma.draw.findFirst({
        where: {
          drawDate: { gt: targetDate },
          status: 'PUBLISHED',
        },
        orderBy: { drawDate: 'asc' },
        select: { drawDate: true },
      }),
      prisma.draw.findMany({
        where: { status: 'PUBLISHED' },
        orderBy: { drawDate: 'desc' },
        take: 100,
        select: { drawDate: true },
      }),
    ]);

    const prevAvailableDate = prevDraw ? formatDateOnly(prevDraw.drawDate) : null;
    const nextAvailableDate = nextDraw ? formatDateOnly(nextDraw.drawDate) : null;
    
    // Distinct set of YYYY-MM-DD dates
    const allAvailableDates = Array.from(
      new Set(allDraws.map((d) => formatDateOnly(d.drawDate)))
    );

    return {
      prevAvailableDate,
      nextAvailableDate,
      allAvailableDates,
    };
  } catch (error) {
    console.error('Error in getAdjacentAvailableDates:', error);
    return {
      prevAvailableDate: null,
      nextAvailableDate: null,
      allAvailableDates: [],
    };
  }
}
