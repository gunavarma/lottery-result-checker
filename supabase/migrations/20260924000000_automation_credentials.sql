-- ====================================================================
-- STORED AUTOMATION CREDENTIAL
-- ====================================================================
-- Why this exists:
--
--   1. Vercel's Hobby plan refuses any cron expression that runs more than once
--      per day (deployment fails outright), so the frequent polling legs are
--      driven by Supabase pg_cron from this database.
--
--   2. Those jobs must present a secret. The environment variable path requires
--      a Vercel dashboard edit plus a redeploy to change, and that step was
--      missed: the deployed CRON_SECRET was the previously exposed value, the
--      application's auth layer correctly refused it, and every scheduled call
--      returned HTTP 503 — the pipeline was dead while the site still looked
--      synchronized.
--
-- A credential both the database and the application can read fixes both: the
-- jobs authenticate, and rotating the secret becomes a single command with no
-- redeploy.
--
-- Only a SHA-256 hash is stored. Reading this table does not reveal a usable
-- secret. The plaintext lives only in cron.job's command body (same database,
-- same trust boundary, already readable only by the database owner) and travels
-- over HTTPS on each call.
--
-- The environment secret keeps working exactly as before and remains the
-- primary credential; this is a second accepted source, not a replacement.
--
-- Register a credential with:
--   node --env-file=.env scripts/configure-automation-cron.mjs
-- ====================================================================

CREATE TABLE IF NOT EXISTS automation_credentials (
  id          TEXT PRIMARY KEY,
  scope       TEXT NOT NULL UNIQUE,
  hash        TEXT NOT NULL,
  "rotatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
