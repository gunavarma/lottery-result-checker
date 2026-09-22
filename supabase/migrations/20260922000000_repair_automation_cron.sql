-- ====================================================================
-- SUPABASE MIGRATION: REPAIR PRODUCTION CRON (OFFICIAL + LIVE POLLER)
-- ====================================================================
-- What was actually wrong in production (verified against cron.job and
-- cron.job_run_details):
--
--   1. The only scheduled job was 'sync-kerala-lottery-results-15m', which
--      called the Supabase Edge Function `check-lottery-results` via
--      net.http_post. That function no longer exists, so all 96 runs a day
--      returned HTTP 404 ("Requested function was not found") and were recorded
--      as SUCCESS by pg_cron (pg_net only queues the request). The official
--      pipeline had therefore been dead while looking healthy.
--
--   2. Neither 20260913000000_consolidate_cron_pipeline.sql nor
--      20260914000001_schedule_live_result_polling.sql could schedule anything:
--      both are gated on app.settings.keraladraws_app_url and
--      app.settings.keraladraws_cron_secret, and both were unset (NULL).
--
-- This migration retires the dead job and schedules the application's own
-- routes, which are the implementation that shares the parser, validation,
-- audit tables and notification dispatch.
--
-- One-time configuration: the two values below are the app's public origin and
-- the CRON_SECRET, and they are inlined into the job bodies when this migration
-- runs.
--
-- Why not `ALTER DATABASE postgres SET app.settings....`? Because it does not
-- work on this project: the postgres role is not a superuser, so it fails with
-- SQLSTATE 42501 (permission denied to set parameter). That is precisely why the
-- earlier migrations' settings were NULL and their jobs were never created.
--
-- IMPORTANT: the secret must match the CRON_SECRET configured in Vercel. The
-- application fails closed (HTTP 503) when its configured secret is missing,
-- too short, or a previously exposed value, so a mismatch stops the jobs loudly
-- rather than silently.
--
-- Rotating the secret therefore means: update CRON_SECRET in Vercel, then
-- re-run section 2 below with the new value (the job bodies embed it).
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA extensions;

-- 1. Retire every previous job, including the one that 404s against the
--    deleted Edge Function and the earlier edge-function cron.
SELECT cron.unschedule('sync-kerala-lottery-results-15m')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'sync-kerala-lottery-results-15m');

SELECT cron.unschedule('check-lottery-results-15m')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'check-lottery-results-15m');

SELECT cron.unschedule('keraladraws-sync-results-15m')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'keraladraws-sync-results-15m');

SELECT cron.unschedule('keraladraws-sync-live-1m')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'keraladraws-sync-live-1m');

-- 2. Schedule both legs of the pipeline.
DO $$
DECLARE
  -- Fill these in before running this migration (see the header).
  app_url text := 'https://www.keraladraws.com';
  cron_secret text := 'REPLACE_WITH_CRON_SECRET';
BEGIN
  IF cron_secret IS NULL OR cron_secret = '' OR cron_secret = 'REPLACE_WITH_CRON_SECRET' THEN
    RAISE NOTICE 'KeralaDraws jobs NOT scheduled: put the CRON_SECRET value into cron_secret first.';
    RETURN;
  END IF;

  -- Official gazette leg: every 15 minutes, all day. Keeps the 3:00 PM - 5:00 PM
  -- IST publication window covered with repeated idempotent attempts, and keeps
  -- running outside it so delayed gazettes and historical gaps still fill in.
  PERFORM cron.schedule(
    'keraladraws-sync-results-15m',
    '*/15 * * * *',
    format(
      $job$
      SELECT net.http_get(
        url := %L,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || %L
        ),
        timeout_milliseconds := 60000
      );
      $job$,
      rtrim(app_url, '/') || '/api/cron/sync-results',
      cron_secret
    )
  );

  -- Live leg: every minute during the publication window only.
  -- 09:00-12:59 UTC == 14:30-18:29 IST: the draw runs at 3:00 PM IST, the live
  -- source starts publishing around 2:55 PM IST, and the gazette follows around
  -- 4:30 PM IST. The route re-checks the window itself and returns without any
  -- external request outside it, so this bound is purely a cost optimisation.
  PERFORM cron.schedule(
    'keraladraws-sync-live-1m',
    '*/1 9-12 * * *',
    format(
      $job$
      SELECT net.http_get(
        url := %L,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || %L
        ),
        timeout_milliseconds := 25000
      );
      $job$,
      rtrim(app_url, '/') || '/api/cron/sync-live',
      cron_secret
    )
  );
END $$;

-- 3. Verify (both rows must appear and be active):
--   SELECT jobname, schedule, active FROM cron.job ORDER BY jobname;
--   SELECT status, return_message, start_time FROM cron.job_run_details
--     ORDER BY start_time DESC LIMIT 10;
-- Note that pg_cron reports "succeeded" for a queued pg_net request; inspect the
-- application's own /api/cron/sync-results response (or net._http_response) to
-- confirm the pipeline itself is authenticated and running.
