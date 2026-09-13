-- ====================================================================
-- SUPABASE MIGRATION: CONSOLIDATE CRON ONTO THE SINGLE SYNC PIPELINE
-- ====================================================================
-- Background
-- ----------
-- Two independent implementations of the official LOTIS -> PostgreSQL
-- pipeline existed:
--   1. The Next.js route  /api/cron/sync-results  (Prisma + Zod validation +
--      line-by-line PDF parser + cache invalidation + FCM dispatch).
--   2. The Supabase Edge Function check-lottery-results (PostgREST writes +
--      a weaker regex parser, no shared validation).
--
-- Only one pipeline may be authoritative. This migration points pg_cron at the
-- Next.js route, which is the implementation that shares the application's
-- parser, validation schema, audit tables, and notification dispatch.
--
-- Configuration (run once per project, stored in the database, never in git):
--   ALTER DATABASE postgres SET app.settings.keraladraws_app_url = 'https://<your-domain>';
--   ALTER DATABASE postgres SET app.settings.keraladraws_cron_secret = '<same value as CRON_SECRET>';
--
-- If either setting is missing the job is NOT scheduled and a NOTICE is raised,
-- so an unconfigured project fails loudly instead of silently never syncing.
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA extensions;

-- 1. Retire the previous jobs (edge-function based and the earlier app-based one).
SELECT cron.unschedule('check-lottery-results-15m')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'check-lottery-results-15m');

SELECT cron.unschedule('sync-kerala-lottery-results-15m')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'sync-kerala-lottery-results-15m');

SELECT cron.unschedule('keraladraws-sync-results-15m')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'keraladraws-sync-results-15m');

-- 2. Schedule the authoritative pipeline every 15 minutes.
--    15 minutes keeps the expected 3:00 PM - 5:00 PM IST publication window
--    covered with repeated idempotent attempts, and keeps running checks outside
--    that window so delayed gazettes and historical gaps are still filled in.
DO $$
DECLARE
  app_url text := current_setting('app.settings.keraladraws_app_url', true);
  cron_secret text := current_setting('app.settings.keraladraws_cron_secret', true);
BEGIN
  IF app_url IS NULL OR app_url = '' OR cron_secret IS NULL OR cron_secret = '' THEN
    RAISE NOTICE 'KeralaDraws sync job NOT scheduled: set app.settings.keraladraws_app_url and app.settings.keraladraws_cron_secret first.';
    RETURN;
  END IF;

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
END $$;
