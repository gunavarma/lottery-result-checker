-- ====================================================================
-- SUPABASE MIGRATION: RESULT VERIFICATION TIER (PROVISIONAL vs OFFICIAL)
-- ====================================================================
-- Adds a trust tier to published draws so an unofficial live aggregator
-- (keralalotteries.net) can publish numbers early WITHOUT ever being confused
-- with, or overwriting, the official LOTIS gazette record.
--
--   verificationLevel = 'OFFICIAL'     -> parsed from the official LOTIS gazette
--   verificationLevel = 'PROVISIONAL'  -> live/unofficial, awaiting gazette
--
-- OFFICIAL outranks PROVISIONAL. The application enforces this in
-- lib/results/persist.ts; the database only provides the storage and index.
--
-- SAFETY: additive only. ADD COLUMN IF NOT EXISTS with defaults that preserve
-- the exact current meaning of every existing row (all existing published
-- results were gazette-sourced, so they default to OFFICIAL / LOTIS).
-- No column is dropped, no row is rewritten, no table is duplicated.
-- ====================================================================

ALTER TABLE "Draw"
  ADD COLUMN IF NOT EXISTS "verificationLevel" TEXT NOT NULL DEFAULT 'OFFICIAL';

ALTER TABLE "Draw"
  ADD COLUMN IF NOT EXISTS "sourceProvider" TEXT NOT NULL DEFAULT 'LOTIS';

ALTER TABLE "Draw"
  ADD COLUMN IF NOT EXISTS "provisionalUpdatedAt" TIMESTAMP(3);

-- Supports "today's result, official only" and provisional-vs-official reads.
CREATE INDEX IF NOT EXISTS "Draw_verificationLevel_drawDate_idx"
  ON "Draw" ("verificationLevel", "drawDate");

-- Backfill guard: any row that already has a gazette document is official.
UPDATE "Draw"
SET "verificationLevel" = 'OFFICIAL', "sourceProvider" = 'LOTIS'
WHERE "sourceDocumentUrl" IS NOT NULL
  AND ("verificationLevel" IS DISTINCT FROM 'OFFICIAL' OR "sourceProvider" IS DISTINCT FROM 'LOTIS');
