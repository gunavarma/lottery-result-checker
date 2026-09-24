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
   - To reproduce a **Vercel production build locally** (correct canonicals, no in-process scheduler), set the platform variables the resolver reads:
     ```
     VERCEL=1 VERCEL_PROJECT_PRODUCTION_URL=www.keraladraws.com npm run build
     ```
     Without `VERCEL=1` the build is treated as local and `.env`'s `NEXT_PUBLIC_SITE_URL=http://localhost:3000` is honoured, which is correct for local development but not a production simulation.

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
- Checks: `npm test` (vitest, 146 tests), `npx tsc --noEmit`, `npm run build`

## Automation (production cron)

**Vercel plan constraint (this is why the jobs live in the database):** the project is on Vercel **Hobby**, which only accepts cron expressions that run **once per day** — `*/10` or `*/1` schedules fail the *deployment* itself ("Hobby accounts are limited to daily cron jobs"), and Hobby also cannot guarantee timing precision (per-hour on the hour, ±59 min). The sub-daily schedules that used to be in `vercel.json` were therefore a deploy blocker and could never have delivered a live result at draw time anyway. `vercel.json` now keeps only daily safety-net jobs; the frequent polling runs on Supabase `pg_cron`, which has no such limit and uses 1-minute granularity inside the draw window.

| runner | schedule | role |
| --- | --- | --- |
| `vercel.json` → `/api/cron/sync-results` | `30 10 * * *` (16:00 IST, daily) | safety net if the database jobs were ever lost |
| `vercel.json` → `/api/cron/sync-news` | `0 11 * * *` (daily) | news refresh |
| pg_cron (below) | 15 min / 1 min | the actual result pipeline |

Two pg_cron jobs live in the production database (`SELECT jobname, schedule, active FROM cron.job`):

| job | schedule | calls |
| --- | --- | --- |
| `keraladraws-sync-results-15m` | `*/15 * * * *` | `/api/cron/sync-results` (official gazette leg) |
| `keraladraws-sync-live-1m` | `*/1 9-12 * * *` (14:30-18:29 IST) | `/api/cron/sync-live` (provisional live leg) |

- Both embed the app origin and a secret; the operator script schedules them **and** registers the credential (reads the secret from the environment, prints nothing sensitive):
  ```
  node --env-file=.env scripts/configure-automation-cron.mjs
  ```
- **Two credential sources.** The environment secret is primary. `automation_credentials` (scope `cron`) stores only a **SHA-256 hash** of the same secret, and `lib/security/auth.ts` accepts either. This exists because production's Vercel `CRON_SECRET` was the previously exposed value, which the auth layer correctly refuses with 503 — and rotating a Vercel env var needs dashboard access plus a redeploy, which is how the pipeline stayed dead while looking healthy. With the stored credential, the scheduled jobs authenticate and the secret can be rotated by re-running the script, with no redeploy. Rotating is still recommended in Vercel too (`NEXT_PUBLIC_SITE_URL` aside, nothing else needs a dashboard change).
- Verified behaviour (`CRON_SECRET` forced to the compromised literal, credential read from the database): valid credential → **200**, no credential → **503**, wrong credential → **503**. Fail-closed is preserved; nothing is authorized without a matching secret.
- `ALTER DATABASE postgres SET app.settings.*` does NOT work on this project (SQLSTATE 42501, postgres is not superuser) — that is why the older migrations never scheduled anything.
- pg_cron reports "succeeded" for merely *queueing* a `pg_net` request. Check `net._http_response` or the endpoint's own JSON to confirm the app actually authenticated (it returns 503 when its configured secret is missing/compromised).

## Historical archive import (keralalotteries.net)

Resumable; state lives in `ImportJob` (`jobType = AGGREGATOR_BACKFILL`, `lastCursor` = last date done).

```
ARCHIVE_MAX_ITER=300 npx vitest run -c vitest.runners.config.ts tests/runners/archive-import.test.ts --testTimeout=5400000
```

The default runner timeout is 1 hour, which is *less* than a full pass takes — a run that hits it is killed mid-flight (progress is kept in `ImportJob`, so re-running continues from `lastCursor`). Pass `--testTimeout` explicitly for a full pass.

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

## Deployment

1. **Deploy the current revision — this is the only required step.** Production is running an older build whose `/api/cron/sync-results` returns HTTP 500 for every request (even unauthenticated). That build also predates the stored-credential auth path, so its scheduled calls fail even though the database jobs are correctly configured. Deploying fixes both, and the earlier deploy failure (sub-daily cron expressions on Hobby) is gone.
2. Recommended, not required: set `CRON_SECRET` in Vercel to the local `.env` value, and `NEXT_PUBLIC_SITE_URL=https://www.keraladraws.com`. Neither is needed for correctness any more — the stored credential authorizes the database jobs, and the site origin resolver ignores a loopback value on a deployed host and prefers Vercel's own production domain.

Verify after deploying with `node --env-file=.env scripts/automation-status.mjs`: the cron HTTP responses must show **200**, not 503.

### SEO surface to confirm on production (was broken)

- `<link rel="canonical">` → `https://www.keraladraws.com/...` (was `http://localhost:3000`)
- `rel="alternate"` hreflang for `en`, `en-IN`, `x-default`, `ml`, `ta`, `hi`
- `/robots.txt`'s `Sitemap:` line and every `<loc>` in `/sitemap.xml` on the production host
- exactly one `<h1>` per page (the homepage hero is now the page's H1)

## Live-state semantics (why the homepage no longer spins forever)

`lib/live-state.ts` is the single computation of today's state, used by `/api/results/today` **and** the homepage's server render (via `lib/results/today-snapshot.ts`). They used to be two hand-maintained copies that drifted: the homepage payload omitted `secondsUntilDraw`, so the hero's countdown started at `0` — the same value that means "draw in progress" — and rendered its spinner instead of a countdown.

| IST window | state | UI |
| --- | --- | --- |
| before 15:00 | `WAITING` | countdown to the draw |
| 15:00-19:00 | `CHECKING` | "result being updated" (spinner is honest here) |
| after 19:00, nothing published | `DELAYED` | "result not published yet" + manual re-check, **no spinner** |
| result stored | `PUBLISHED` | the result |

Previously everything after 15:00 was "checking", so the homepage spun from 3 PM until midnight every day. Client polling is bounded to match (30s inside the window, 5 min outside).

## Notes

- Registering preview: `register_preview` with `http://127.0.0.1:<port>` and the server pid.
- `.freebuff/preview-start.sh` is the launchd-safe wrapper (sets PATH, HOME, VERCEL=1).
