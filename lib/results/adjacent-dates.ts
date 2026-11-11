import { prisma } from '@/lib/prisma';
import { formatDateOnly, parseDateOnlyUtc } from '@/lib/date';

/** Finds the nearest published draw date before and after a historical date. */
export async function getAdjacentAvailableDates(currentDateStr: string): Promise<{
  prevAvailableDate: string | null;
  nextAvailableDate: string | null;
  allAvailableDates: string[];
}> {
  try {
    const targetDate = parseDateOnlyUtc(currentDateStr);
    const [prevDraw, nextDraw] = await Promise.all([
      prisma.draw.findFirst({ where: { drawDate: { lt: targetDate }, status: 'PUBLISHED' }, orderBy: { drawDate: 'desc' }, select: { drawDate: true } }),
      prisma.draw.findFirst({ where: { drawDate: { gt: targetDate }, status: 'PUBLISHED' }, orderBy: { drawDate: 'asc' }, select: { drawDate: true } }),
    ]);
    return {
      prevAvailableDate: prevDraw ? formatDateOnly(prevDraw.drawDate) : null,
      nextAvailableDate: nextDraw ? formatDateOnly(nextDraw.drawDate) : null,
      allAvailableDates: [],
    };
  } catch (error) {
    console.error('Error in getAdjacentAvailableDates:', error);
    return { prevAvailableDate: null, nextAvailableDate: null, allAvailableDates: [] };
  }
}
