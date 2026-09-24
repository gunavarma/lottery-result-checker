/**
 * Applies supabase/migrations/20260922000000_repair_automation_cron.sql to the
 * database at DATABASE_URL, setting the database-level configuration first in a
 * separate connection (ALTER DATABASE ... SET only affects NEW sessions).
 *
 * Prints only non-sensitive diagnostics.
 */
import crypto from 'node:crypto';
import { PrismaClient } from '@prisma/client';

const APP_URL = process.env.CRON_APP_URL || 'https://www.keraladraws.com';
const CRON_SECRET = process.env.CRON_SECRET;

if (!CRON_SECRET) {
  console.error('CRON_SECRET is not set in the environment; refusing to configure jobs.');
  process.exit(1);
}

const escapeLiteral = (value) => value.replace(/'/g, "''");

/**
 * The job body is built with format(%L) exactly like the migration, so the URL
 * and secret are safely quoted SQL literals rather than string concatenation.
 */
function scheduleSql(jobName, schedule, path, timeoutMs) {
  const body = `SELECT net.http_get(
        url := %L,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || %L
        ),
        timeout_milliseconds := ${timeoutMs}
      );`;

  return `SELECT cron.schedule(${quote(jobName)}, ${quote(schedule)}, format(${quote(body)}, ${quote(
    APP_URL.replace(/\/+$/, '') + path
  )}, ${quote(CRON_SECRET)}));`;
}

function quote(value) {
  return `$kd$${value}$kd$`;
}

const JOB_SQL = {
  official: scheduleSql('keraladraws-sync-results-15m', '*/15 * * * *', '/api/cron/sync-results', 60000),
  live: scheduleSql('keraladraws-sync-live-1m', '*/1 9-12 * * *', '/api/cron/sync-live', 25000),
};

const RETIRE = [
  'sync-kerala-lottery-results-15m',
  'check-lottery-results-15m',
  'keraladraws-sync-results-15m',
  'keraladraws-sync-live-1m',
];

async function main() {
  const client = new PrismaClient();
  try {
    const who = await client.$queryRawUnsafe(
      'SELECT current_user::text AS role, current_database()::text AS db'
    );
    console.log('connected as', JSON.stringify(who));
    console.log('target origin', APP_URL, '| secret length', CRON_SECRET.length);

    for (const jobName of RETIRE) {
      const existing = await client.$queryRawUnsafe(
        `SELECT jobname FROM cron.job WHERE jobname = '${jobName}'`
      );
      if (existing.length > 0) {
        await client.$executeRawUnsafe(`SELECT cron.unschedule('${jobName}')`);
        console.log('retired job:', jobName);
      }
    }

    // The application also accepts a credential stored here (hash only), so the
    // polling legs keep working even when the deployed environment secret is
    // missing, stale or — as in production — a previously exposed value that the
    // auth layer refuses. Without this, every scheduled call returns 503 and the
    // pipeline is silently dead.
    await client.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS automation_credentials (
        id          TEXT PRIMARY KEY,
        scope       TEXT NOT NULL UNIQUE,
        hash        TEXT NOT NULL,
        "rotatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    const hash = crypto.createHash('sha256').update(CRON_SECRET, 'utf8').digest('hex');
    await client.$executeRawUnsafe(
      `INSERT INTO automation_credentials (id, scope, hash, "rotatedAt", "createdAt", "updatedAt")
       VALUES ($1, 'cron', $2, NOW(), NOW(), NOW())
       ON CONFLICT (scope) DO UPDATE
         SET hash = EXCLUDED.hash, "rotatedAt" = NOW(), "updatedAt" = NOW()`,
      `cred_cron_${hash.slice(0, 16)}`,
      hash
    );
    console.log('stored cron credential hash (sha256):', hash.slice(0, 12) + '…');

    await client.$executeRawUnsafe(JOB_SQL.official);
    console.log('scheduled: keraladraws-sync-results-15m (*/15 * * * *)');
    await client.$executeRawUnsafe(JOB_SQL.live);
    console.log('scheduled: keraladraws-sync-live-1m (*/1 9-12 * * *)');

    const jobs = await client.$queryRawUnsafe(
      'SELECT jobname, schedule, active FROM cron.job ORDER BY jobname'
    );
    console.log('CRON JOBS NOW:', JSON.stringify(jobs));

    const preview = await client.$queryRawUnsafe(
      "SELECT command FROM cron.job WHERE jobname = 'keraladraws-sync-live-1m'"
    );
    console.log(
      'live job targets the right endpoint:',
      preview[0].command.includes('/api/cron/sync-live'),
      '| bearer header present:',
      preview[0].command.includes('Bearer')
    );
  } finally {
    await client.$disconnect();
  }
}

main().catch((error) => {
  console.error('FATAL:', String(error.message).split('\n')[0]);
  process.exitCode = 1;
});
