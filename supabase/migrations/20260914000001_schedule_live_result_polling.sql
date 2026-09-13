-- ====================================================================
-- SUPABASE MIGRATION: 1-MINUTE PROVISIONAL LIVE RESULT POLLER
-- ====================================================================
-- Adds the fast leg of the pipeline: polls the unofficial live aggregator
-- (keralalotteries.net) every minute during the Kerala lottery publication
-- window so users see winning numbers within about a minute of publication.
--
-- Window: 09:00-12:59 UTC == 14:30-18:29 IST.
--   - draw proceedings start 3:00 PM IST
--   - the live source starts publishing around 2:55 PM IST
--   - the official gazette arrives around 4:30 PM IST
-- The route itself re-checks the window, so this scheduler bound is only an
-- invocation-cost optimisation; the handler also returns immediately without
-- any external request outside the window.
--
-- Runs alongside (not instead of) the 15-minute official LOTIS sync. Whatever
-- this job writes is PROVISIONAL and is upgraded in place by the gazette sync.
--
-- Configuration is shared with the official job and read from the database,
-- never from git:
--   ALTER DATABASE postgres SET app.settings.keraladraws_app_url = 'https://<your-domain>';
--   ALTER DATABASE postgres SET app.settings.keraladraws_cron_secret = '<same value as CRON_SECRET>';
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA extensions;

SELECT cron.unschedule('keraladraws-sync-live-1m')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'keraladraws-sync-live-1m');

DO $$
DECLARE
  app_url text := current_setting('app.settings.keraladraws_app_url', true);
  cron_secret text := current_setting('app.settings.keraladraws_cron_secret', true);
BEGIN
  IF app_url IS NULL OR app_url = '' OR cron_secret IS NULL OR cron_secret = '' THEN
    RAISE NOTICE 'KeralaDraws live poller NOT scheduled: set app.settings.keraladraws_app_url and app.settings.keraladraws_cron_secret first.';
    RETURN;
  END IF;

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
