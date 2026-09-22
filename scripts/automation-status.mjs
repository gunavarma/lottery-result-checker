#!/usr/bin/env node
/**
 * Automation status — replaces the deleted admin panel's "system status" view.
 *
 *   node --env-file=.env scripts/automation-status.mjs
 *
 * Prints the pg_cron schedule, the last runs and their HTTP results, the
 * result/import table counts, and the health verdict of the sync pipeline.
 * Secrets are redacted: nothing printed here is usable as a credential.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const secret = process.env.CRON_SECRET || '';
const redact = (s = '') =>
  String(s)
    .split(secret)
    .join('«secret»')
    .replace(/[A-Za-z0-9_-]{28,}/g, '«redacted»');

const iso = (v) => (v instanceof Date ? v.toISOString() : String(v ?? ''));

try {
  console.log('=== pg_cron jobs ===');
  for (const j of await prisma.$queryRawUnsafe(
    'select jobid, jobname, schedule, active, command from cron.job order by jobname'
  )) {
    console.log(`#${j.jobid} ${j.jobname} [${j.schedule}] active=${j.active}`);
    console.log(`     ${redact(j.command).slice(0, 160)}`);
  }

  console.log('=== recent cron runs ===');
  for (const r of await prisma.$queryRawUnsafe(
    `select j.jobname, r.status, r.return_message, r.start_time
       from cron.job_run_details r join cron.job j using (jobid)
      order by r.start_time desc limit 6`
  )) {
    console.log(`${iso(r.start_time)} ${r.jobname} ${r.status} ${redact(r.return_message).slice(0, 90)}`);
  }

  console.log('=== cron HTTP results (net._http_response) ===');
  for (const r of await prisma.$queryRawUnsafe(
    'select status_code, left(content, 200) as body, created from net._http_response order by created desc limit 6'
  )) {
    console.log(`${iso(r.created)} HTTP ${r.status_code} ${redact(r.body)}`);
  }

  console.log('=== sync job rows ===');
  for (const j of await prisma.$queryRawUnsafe(
    `select "jobType", status, "lastCursor", "processedItems", "totalItems",
            "successfulItems", "failedItems", "errorSummary", "updatedAt"
       from "ImportJob" order by "updatedAt" desc limit 6`
  )) {
    console.log(
      `${j.jobType} ${j.status} cursor=${j.lastCursor ?? '-'} ` +
        `${j.processedItems ?? '?'}/${j.totalItems ?? '?'} ok=${j.successfulItems ?? 0} failed=${j.failedItems ?? 0} ` +
        `${iso(j.updatedAt)} err=${redact(j.errorSummary).slice(0, 70) || '-'}`
    );
  }

  console.log('=== draws by status/verification ===');
  for (const c of await prisma.$queryRawUnsafe(
    'select status, "verificationLevel", count(*)::int as c from "Draw" group by 1,2 order by c desc'
  )) {
    console.log(`${c.status} ${c.verificationLevel} ${c.c}`);
  }

  console.log('=== newest draws ===');
  for (const d of await prisma.$queryRawUnsafe(
    `select d."drawDate", l.name, d."drawNumber", d.status, d."verificationLevel"
       from "Draw" d join "Lottery" l on l.id = d."lotteryId"
      order by d."drawDate" desc limit 5`
  )) {
    console.log(`${iso(d.drawDate).slice(0, 10)} ${d.drawNumber} ${d.name} ${d.status}/${d.verificationLevel}`);
  }

  console.log('=== import errors by type/status ===');
  for (const e of await prisma.$queryRawUnsafe(
    'select "errorType", status, count(*)::int as c from "ImportError" group by 1,2 order by c desc limit 10'
  )) {
    console.log(`${e.errorType} ${e.status} ${e.c}`);
  }

  console.log('=== unresolved failures (sample) ===');
  for (const e of await prisma.$queryRawUnsafe(
    `select "sourceIdentifier", "errorMessage" from "ImportError"
      where status = 'PENDING' order by "createdAt" desc limit 8`
  )) {
    console.log(`- ${e.sourceIdentifier}: ${redact(e.errorMessage).slice(0, 110)}`);
  }
} catch (error) {
  console.error('automation-status failed:', error.message);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
