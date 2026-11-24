-- Reduce live-source requests while retaining frequent updates during the draw.
-- The current command already contains the configured URL and bearer secret;
-- carry it forward without exposing or re-entering the credential.
DO $$
DECLARE
  existing_command text;
BEGIN
  SELECT command INTO existing_command
    FROM cron.job
   WHERE jobname IN ('keraladraws-sync-live-1m', 'keraladraws-sync-live-2m')
   ORDER BY CASE WHEN jobname = 'keraladraws-sync-live-1m' THEN 0 ELSE 1 END
   LIMIT 1;

  IF existing_command IS NULL THEN
    RAISE NOTICE 'Live sync cron job not found; no schedule changed.';
    RETURN;
  END IF;

  PERFORM cron.unschedule(jobid)
    FROM cron.job
   WHERE jobname IN ('keraladraws-sync-live-1m', 'keraladraws-sync-live-2m');

  PERFORM cron.schedule(
    'keraladraws-sync-live-2m',
    '*/2 9-11 * * *',
    existing_command
  );
END $$;
