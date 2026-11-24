import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('DATABASE_URL is not set in the environment; refusing to change the live schedule.');
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl, max: 1 }),
});

try {
  const existing = await prisma.$queryRawUnsafe(
    `SELECT jobname, command FROM cron.job
      WHERE jobname IN ('keraladraws-sync-live-1m', 'keraladraws-sync-live-2m')
      ORDER BY CASE WHEN jobname = 'keraladraws-sync-live-1m' THEN 0 ELSE 1 END
      LIMIT 1`
  );
  const command = existing[0]?.command;
  if (!command || !command.includes('/api/cron/sync-live') || !command.includes('Bearer')) {
    throw new Error('Existing authenticated live-sync job was not found; no schedule was changed.');
  }

  await prisma.$executeRawUnsafe(
    `SELECT cron.unschedule(jobid) FROM cron.job
      WHERE jobname IN ('keraladraws-sync-live-1m', 'keraladraws-sync-live-2m')`
  );
  await prisma.$queryRawUnsafe(
    'SELECT cron.schedule($1, $2, $3)',
    'keraladraws-sync-live-2m',
    '*/2 9-11 * * *',
    command
  );
  const applied = await prisma.$queryRawUnsafe(
    `SELECT schedule, active FROM cron.job WHERE jobname = 'keraladraws-sync-live-2m'`
  );
  if (applied[0]?.schedule !== '*/2 9-11 * * *' || !applied[0]?.active) {
    throw new Error('The database did not report the expected active two-minute schedule.');
  }
  console.log('Live polling is scheduled every 2 minutes from 14:30 through 17:28 IST.');
} finally {
  await prisma.$disconnect();
}
