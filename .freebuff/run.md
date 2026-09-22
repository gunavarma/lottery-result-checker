# KeralaDraws — Local Run Guide

Next.js 16 (App Router) + Prisma + Supabase Postgres. Node via Homebrew.

## Reproduce uncommitted artifacts

1. Copy env from the main checkout (this workspace IS the main checkout; a fresh worktree must copy):
   ```
   cp /Users/guna/Documents/lottery-result-checker/.env ./.env
   ```
   `.env` is gitignored and holds `DATABASE_URL`, `CRON_SECRET`, `ADMIN_SECRET`, Firebase + VAPID keys, `NEXT_PUBLIC_SITE_URL`. Never commit or print these values.
2. Install deps with npm (project uses `package-lock.json`): `npm install`
3. Generate the Prisma client: `npx prisma generate`
4. Build artifacts (production server needs `.next`): `npm run build`

## Run the server

Production preview (what the Preview tab uses):

```
nohup env VERCEL=1 ./node_modules/.bin/next start -p 3401 > .freebuff/preview.log 2>&1 < /dev/null &
```

- `VERCEL=1` disables the dev-only in-process result scheduler in `instrumentation.ts` (otherwise `npm start`/`next start` syncs against the PRODUCTION database every 15 minutes — keep this flag unless you intend that).
- Port 3401 because 3000/3001 are occupied by other servers on this machine. Any free port works: change `-p`.
- The command tool's background processes may be reaped; if the server dies between tool calls, relaunch via `start_new_session` fork (python `subprocess.Popen`) or `launchctl submit` with a PATH-fixed wrapper (`.freebuff/preview-start.sh`).

Dev alternative: `npx next dev -p 3399` (refuses if another dev server for this project is already running — check with `lsof -nP -iTCP:3001 -sTCP:LISTEN`).

## Verify after starting

- `curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3401/` → 200
- Locale trees: `/ml`, `/ta`, `/hi` → 200 with native `html lang`
- Checks: `npm test` (vitest, 124 tests), `npx tsc --noEmit`, `npm run build`

## Automation (production cron)

Two pg_cron jobs live in the production database (`SELECT jobname, schedule, active FROM cron.job`):

| job | schedule | calls |
| --- | --- | --- |
| `keraladraws-sync-results-15m` | `*/15 * * * *` | `/api/cron/sync-results` (official gazette leg) |
| `keraladraws-sync-live-1m` | `*/1 9-12 * * *` (14:30-18:29 IST) | `/api/cron/sync-live` (provisional live leg) |

- Both embed the app origin and the `CRON_SECRET`; **rotating the secret means re-running the scheduling step**, either as section 2 of `supabase/migrations/20260922000000_repair_automation_cron.sql` or with the operator script (reads the secret from the environment, prints nothing sensitive):
  ```
  node --env-file=.env scripts/configure-automation-cron.mjs
  ```
- `ALTER DATABASE postgres SET app.settings.*` does NOT work on this project (SQLSTATE 42501, postgres is not superuser) — that is why the older migrations never scheduled anything.
- pg_cron reports "succeeded" for merely *queueing* a `pg_net` request. Check `net._http_response` or the endpoint's own JSON to confirm the app actually authenticated (it returns 503 when its configured secret is missing/compromised).

## Historical archive import (keralalotteries.net)

Resumable; state lives in `ImportJob` (`jobType = AGGREGATOR_BACKFILL`, `lastCursor` = last date done).

```
ARCHIVE_MAX_ITER=300 npx vitest run -c vitest.runners.config.ts tests/runners/archive-import.test.ts
```

- Writes `PROVISIONAL` rows only; a gazette sync upgrades them in place. Excluded from the sitemap and never notified.
- Each batch of 20 also cross-verifies any dates we already hold as `OFFICIAL` and records disagreements as `SOURCE_MISMATCH` import errors.
- Schemes with no draw in 90 days are marked `active: false` automatically, so retired schemes never appear in the homepage "active schemes" list.

### Operator runners

`tests/runners/**` are long-running operators, excluded from `npm test` (fast, offline-safe) and run through their own config:

```
npx vitest run -c vitest.runners.config.ts tests/runners/archive-repair.test.ts
```

- `archive-import.test.ts` — full-archive import loop (above).
- `archive-repair.test.ts` — re-ingests dates recorded as `PARSE_ERROR`, so failures recorded *before* a parser fix get a second chance. Safe to re-run: already-imported draws are skipped (idempotent).
- Both are safe to kill and re-run; progress lives in `ImportJob`, not in the process.

### Date-conflict pages (deliberately not imported)

Some aggregator pages contradict themselves: the URL's slug date disagrees with the page's own "Date of Draw". Both candidates can be wrong (e.g. `AK-550`: the slug says 2022-05-25, the page says 2022-05-18 — but our own 7-day sequence `AK-549@05-18 → AK-551@06-01` proves 05-25 is correct; other pages are wrong in the opposite direction). The importer therefore **refuses** these pages rather than guessing, and records them as `PARSE_ERROR` with the conflicting dates. Resolving them needs sequence evidence from neighbouring draws, not a heuristic.

Status after the parser fixes + repair pass: 67 previously-failed dates re-ingested successfully, 19 conflict pages still refused. Re-run the repair pass after the main import finishes — it is idempotent and picks up anything now parseable.

## Automation status (replaces the removed admin panel)

```
node --env-file=.env scripts/automation-status.mjs
```

Prints pg_cron jobs, the last cron runs, the HTTP result of each scheduled call, `ImportJob` cursors, draw counts by status, and unresolved import failures. Secrets are redacted.

## Deployment requirement (live results depend on this)

The pg_cron jobs call the deployed app and must authenticate against it:

1. `CRON_SECRET` — the value in the local `.env` is a fresh 43-char random string; the value currently configured in Vercel is the old, publicly exposed one, so the app rejects every scheduled call with HTTP 503. Copy the local `.env` value into Vercel's `CRON_SECRET`.
2. Deploy the current revision: production is running an older build whose `/api/cron/sync-results` returns HTTP 500 for every request (even unauthenticated), while the same route returns 200 locally in production mode.

Until both are done the automation is scheduled and firing but cannot publish. Verify afterwards with `scripts/automation-status.mjs` — the cron HTTP responses must show 200.

## Notes

- Registering preview: `register_preview` with `http://127.0.0.1:<port>` and the server pid.
- `.freebuff/preview-start.sh` is the launchd-safe wrapper (sets PATH, HOME, VERCEL=1).
