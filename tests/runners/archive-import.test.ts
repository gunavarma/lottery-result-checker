import { describe, it } from 'vitest';
import { runAggregatorBackfill } from '@/lib/sources/keralalotteries/backfill';

const MAX_ITERATIONS = Number(process.env.ARCHIVE_MAX_ITER || '3');
const RESTART = process.env.ARCHIVE_RESTART === '1';

describe('full archive import from keralalotteries.net', () => {
  it(
    'imports and verifies every published draw page',
    async () => {
      const totals = {
        created: 0,
        updated: 0,
        skipped: 0,
        failed: 0,
        verified: 0,
        verifiedMismatches: 0,
      };

      for (let iteration = 1; iteration <= MAX_ITERATIONS; iteration++) {
        const started = Date.now();
        const result = await runAggregatorBackfill({
          fullArchive: true,
          batchSize: 20,
          restart: RESTART && iteration === 1,
        });

        totals.created += result.created;
        totals.updated += result.updated;
        totals.skipped += result.skipped;
        totals.failed += result.failed;
        totals.verified += result.verified;
        totals.verifiedMismatches += result.verifiedMismatches;

        console.log(
          `[iter ${iteration}] status=${result.status} cursor=${result.lastCursor} ` +
            `processed=${result.processed}/${result.discovered} created=${result.created} ` +
            `updated=${result.updated} skipped=${result.skipped} failed=${result.failed} ` +
            `verified=${result.verified} mismatches=${result.verifiedMismatches} ` +
            `${Math.round((Date.now() - started) / 1000)}s`
        );
        if (result.errors.length > 0) {
          console.log(`   errors(sample): ${result.errors.slice(0, 3).join(' | ')}`);
        }

        if (result.status === 'COMPLETED' || result.status === 'FAILED') {
          console.log(`FINAL status=${result.status}`);
          break;
        }
      }

      console.log('TOTALS ' + JSON.stringify(totals));
    },
    3_600_000
  );
});
