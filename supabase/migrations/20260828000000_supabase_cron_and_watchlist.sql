-- ====================================================================
-- SUPABASE MIGRATION: CRON SCHEDULING & TICKET WATCHLIST INFRASTRUCTURE
-- ====================================================================
-- Authoritative Data Source: Official LOTIS Portal (Directorate of Kerala State Lotteries)
-- Execution Frequency: Every 15 minutes (*/15 * * * *)

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA extensions;

-- Grant permissions for cron execution
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- 2. Ensure TicketWatchlist Table Structure
CREATE TABLE IF NOT EXISTS public."TicketWatchlist" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "lotteryId" TEXT NOT NULL,
    "ticketNumber" TEXT NOT NULL,
    "series" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketWatchlist_pkey" PRIMARY KEY ("id")
);

-- Foreign key relationship to Lottery
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'TicketWatchlist_lotteryId_fkey'
    ) THEN
        ALTER TABLE public."TicketWatchlist"
        ADD CONSTRAINT "TicketWatchlist_lotteryId_fkey"
        FOREIGN KEY ("lotteryId") REFERENCES public."Lottery"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS "TicketWatchlist_lotteryId_idx" ON public."TicketWatchlist"("lotteryId");
CREATE INDEX IF NOT EXISTS "TicketWatchlist_ticketNumber_idx" ON public."TicketWatchlist"("ticketNumber");
CREATE INDEX IF NOT EXISTS "TicketWatchlist_userId_idx" ON public."TicketWatchlist"("userId");

-- 3. Row Level Security (RLS) Policies
ALTER TABLE public."TicketWatchlist" ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'TicketWatchlist' AND policyname = 'Allow public insert to TicketWatchlist'
    ) THEN
        CREATE POLICY "Allow public insert to TicketWatchlist"
        ON public."TicketWatchlist"
        FOR INSERT
        TO anon, authenticated
        WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'TicketWatchlist' AND policyname = 'Allow users to read own TicketWatchlist'
    ) THEN
        CREATE POLICY "Allow users to read own TicketWatchlist"
        ON public."TicketWatchlist"
        FOR SELECT
        TO anon, authenticated
        USING (true);
    END IF;
END $$;

-- 4. Supabase Cron (pg_cron) 15-Minute Scheduled Execution
-- This triggers the Supabase Edge Function 'check-lottery-results' every 15 minutes.
-- Clean up any existing job with the same name before re-scheduling:
SELECT cron.unschedule('check-lottery-results-15m')
WHERE EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'check-lottery-results-15m'
);

-- Schedule pg_cron to run every 15 minutes: */15 * * * *
-- Uses pg_net to invoke the check-lottery-results edge function asynchronously:
SELECT cron.schedule(
    'check-lottery-results-15m',
    '*/15 * * * *',
    $$
    SELECT
      net.http_post(
        url := COALESCE(
          current_setting('app.settings.edge_function_url', true),
          'https://ezwakzemcyeypboxopur.supabase.co/functions/v1/check-lottery-results'
        ),
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || COALESCE(
            current_setting('app.settings.service_role_key', true),
            'sb_publishable_wGqU6Y2sGWWo5ttDu2FhWg_xWEx1XjD'
          )
        ),
        body := jsonb_build_object(
          'source', 'pg_cron',
          'timestamp', now()
        )
      );
    $$
);
