-- ====================================================================
-- SUPABASE MIGRATION: CRON SCHEDULING, SYNC RUNS & TIMEZONE-INVARIANT DATES
-- ====================================================================
-- Authoritative Data Source: Official LOTIS Portal (Directorate of Kerala State Lotteries)
-- Execution Frequency: Every 15 minutes (*/15 * * * *)

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA extensions;

GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- 2. Alter Draw Table drawDate to DATE
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Draw' AND column_name = 'drawDate' AND data_type != 'date'
  ) THEN
    UPDATE "Draw" SET "drawDate" = ("drawDate" + INTERVAL '5 hours 30 minutes')::date;
    ALTER TABLE "Draw" ALTER COLUMN "drawDate" TYPE date;
  END IF;
END $$;

-- 3. Create sync_runs Table for Auditing
CREATE TABLE IF NOT EXISTS public."sync_runs" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "job_name" TEXT NOT NULL,
  "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completed_at" TIMESTAMP(3),
  "status" TEXT NOT NULL DEFAULT 'RUNNING',
  "items_checked" INTEGER NOT NULL DEFAULT 0,
  "items_created" INTEGER NOT NULL DEFAULT 0,
  "items_updated" INTEGER NOT NULL DEFAULT 0,
  "items_failed" INTEGER NOT NULL DEFAULT 0,
  "error_summary" TEXT
);

CREATE INDEX IF NOT EXISTS "sync_runs_job_name_idx" ON public."sync_runs"("job_name");
CREATE INDEX IF NOT EXISTS "sync_runs_started_at_idx" ON public."sync_runs"("started_at");
CREATE INDEX IF NOT EXISTS "sync_runs_status_idx" ON public."sync_runs"("status");

-- 4. Supabase Cron (pg_cron) 15-Minute Scheduled Execution
SELECT cron.unschedule('sync-kerala-lottery-results-15m')
WHERE EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'sync-kerala-lottery-results-15m'
);

SELECT cron.schedule(
    'sync-kerala-lottery-results-15m',
    '*/15 * * * *',
    $$
    SELECT
      net.http_get(
        url := COALESCE(
          current_setting('app.settings.sync_url', true),
          'https://ezwakzemcyeypboxopur.supabase.co/functions/v1/check-lottery-results'
        ),
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || COALESCE(
            current_setting('app.settings.service_role_key', true),
            'sb_publishable_wGqU6Y2sGWWo5ttDu2FhWg_xWEx1XjD'
          )
        )
      );
    $$
);
