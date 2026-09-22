import { describe, it } from 'vitest';
import { prisma } from '@/lib/prisma';
import { backfillOneDate } from '@/lib/sources/keralalotteries/backfill';
import { toDrawPageRef } from '@/lib/sources/keralalotteries/client';

/**
 * Re-ingests dates whose pages were recorded as failures. Runs after the main
 * archive pass: failures recorded before a parser fix are retryable, and a page
 * that still cannot be parsed simply stays recorded as a failure.
 */
describe('repair failed archive dates', () => {
  it(
    're-ingests every date recorded as a parse failure',
    async () => {
      const failures = await prisma.importError.findMany({
        where: { errorType: 'PARSE_ERROR', status: 'PENDING' },
        select: { id: true, sourceIdentifier: true },
        orderBy: { createdAt: 'asc' },
        take: 500,
      });

      const byDate = new Map<string, { date: string; drawNumber: string; ids: string[] }>();
      for (const failure of failures) {
        const ref = toDrawPageRef(failure.sourceIdentifier);
        if (!ref) continue;
        const key = `${ref.dateStr}|${ref.drawNumber}`;
        const entry = byDate.get(key) ?? { date: ref.dateStr, drawNumber: ref.drawNumber, ids: [] };
        entry.ids.push(failure.id);
        byDate.set(key, entry);
      }

      console.log(`repair candidates: ${byDate.size} distinct draws from ${failures.length} failures`);

      let repaired = 0;
      let stillFailing = 0;

      for (const { date, drawNumber, ids } of byDate.values()) {
        const result = await backfillOneDate(date);
        if (result.ok) {
          repaired++;
          await prisma.importError.updateMany({
            where: { id: { in: ids } },
            data: { status: 'RESOLVED', errorMessage: `${result.message} (repaired)` },
          });
          console.log(`  repaired ${drawNumber} (${date})`);
        } else {
          stillFailing++;
          console.log(`  still failing ${drawNumber} (${date}): ${result.message}`);
        }
      }

      console.log(`TOTALS repaired=${repaired} stillFailing=${stillFailing}`);
    },
    3_600_000
  );
});
