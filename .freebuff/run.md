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

## Fetch-route performance audit (2026-09-24)

Guarantee: **no read route ever contacts keralalotteries.net or LOTIS per request.** External
fetchers live only in `lib/sources/*` and `lib/lotis/*`, and are wired exclusively into the four
auth-protected cron routes. Every public read path is DB/cache only:

| Surface | Data source | Steady-state latency (measured locally) |
| --- | --- | --- |
| `/` + Recent Official Results | `homepage_data_v3` SWR cache + ISR 30 | ~7 ms |
| `/results` hub | `results_hub_data` SWR cache | ~15 ms |
| `/api/results/today`, `/api/results/dates` | SWR cache (10–30s TTL) | ~2–3 ms |
| `/api/live` | new `api_live_state` SWR cache (5s TTL / 60s SWR), header stays `no-store` | cold ~0.7s → warm **~3 ms** |
| `/api/lotteries` | new `api_lotteries_directory` SWR cache (5min/10min) | cold ~2.6s → warm **~3 ms** |
| `/api/results/latest` | new per-limit SWR cache (60s/5min) | cold ~0.6s → warm **~4 ms** |
| `/api/results/history` | new per-filter SWR cache (60s/5min, count + page) | cold ~0.7s → warm **~3 ms** |
| `/api/search` | DB reads over indexed columns, CDN s-maxage 30 | — |
| news (all surfaces) | static in-memory `lib/news.ts` | ~0 |

The four routes added in this audit previously re-ran their nested Prisma queries on every request
(cold requests paid multiple remote-Supabase roundtrips; `/api/live` was polled every 10s per
visitor during the publication window). All hot pages keep their ISR/CDN caching; these caches only
bound database load per server instance.

The archive import (jobType AGGREGATOR_BACKFILL) **completed**: totals created=230, updated=2,
failed=1, verified=109, mismatches=2. The one failure is SK-67 (2026-08-28), deliberately refused
because the page-stated date contradicts its slug date — same policy as the 89 earlier refusals.

## Database connectivity (why a cold visit showed an empty homepage)

Observed 2026-09-26 against production, and this — not a UI bug — is why a **new device** saw
"Results are synchronizing with the official LOTIS gazette database" in Recent Official Results
and "AWAITING OFFICIAL PUBLICATION / RESULT NOT PUBLISHED YET" in the Today card:

```
$ curl -s https://www.keraladraws.com/api/results/latest?limit=6
{"success":false,"error":"Can't reach database server at
 aws-0-ap-southeast-1.pooler.supabase.com:5432"}   # http=500
```

- The homepage HTML contained **zero** draw numbers and both empty-state strings, so the server
  render itself was degraded — not a client hydration problem.
- It is **intermittent**, which is why existing visitors kept seeing results: 4 consecutive
  requests failed (each after ~5.44s — Prisma's 5s default connect timeout) and the 5th succeeded
  with `count: 1843` in 2.7s, after which a warm instance answered in ~0.2s.
- The error names port **5432**, i.e. production's `DATABASE_URL` is the Supabase **session**
  pooler. The local `.env` uses the **transaction** pooler on **6543**
  (`?pgbouncer=true&connection_limit=10`). Every concurrent Vercel lambda on 5432 holds a real
  Postgres connection; once the pooler's session limit is reached it refuses new ones, and Prisma
  reports "Can't reach database server".

**Fix (Vercel dashboard — cannot be done from the repo):** set production `DATABASE_URL` to the
port 6543 transaction pooler form with a small `connection_limit` (see README §3), and keep
`DIRECT_URL` on 5432 for migrations. `lib/db-url.ts` additionally appends `connect_timeout=10` so
the 5s cold-connect timeout is no longer the failure point.

App-side mitigation already in place: the homepage's client components treat a `success: false`
payload as untrusted and refetch (`/api/results/today`, `/api/results/latest`, `/api/lotteries`),
and `getHomepageData()` no longer caches a degraded payload, so one failed read cannot pin an
empty homepage for minutes after the database recovers.

## Deployment

1. **Deploy the current revision.** The earlier theory that production runs a stale build is
   **wrong**: every DB-backed route returns HTTP 500 because of the connectivity failure above,
   not because of old code. Deploying ships the client self-heal, the `homepage_data_v4` cache key
   and the raised connect timeout; the `DATABASE_URL` correction above is still required for the
   backend to be reliably reachable.
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
