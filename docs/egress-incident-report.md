# Supabase Egress + Backend Performance — Engineering Report

**Scope:** read-path, caching, ticket-checker and invalidation fixes for the Supabase Free-plan egress
exhaustion (services restricted; measured peak ~8–10 GB/day).
**Branch:** `astro` (no commit made — all changes are on disk, uncommitted).
**Constraint compliance:** no Supabase upgrade, no Postgres/Prisma replacement, no Redis, no new
dependencies, LOTIS + Gazette ingestion untouched, no UI changes beyond one honest count, no
`noindex`, no removed URLs, SSR HTML preserved.

---

## 1. Root cause of the Supabase egress

Five compounding causes, each measured against the production database:

1. **A column nobody reads was on every read.** `include:` selects *every* scalar of the included
   model, so every `Draw` read carried `rawText` — the source Gazette/LOTIS document text, up to
   20 000 chars, **13.67 MB across 1 848 draws (~7.4 KB average)**. Verified by grepping every
   consumer for `.rawText`, `.sourceHash`, `.sourceItemId`, `.sourceProvider`, `.lastCheckedAt`:
   **zero reads**. It accounted for 84.5 KB of a single-draw read, and under Next.js it was shipped
   to the browser inside the RSC payload.
2. **Historical pages were uncached on every hit.** Production measured
   `/kerala-lottery-result/2026-09-28` as `private, no-cache, no-store` with a Vercel cache **MISS
   on every request**. Every visitor and every crawler rendered a published, permanently immutable
   result from Postgres.
3. **The ticket checker was a full-table scan in disguise**, and it is a public GET endpoint:
   10 published draws with their complete prize trees, then a JavaScript loop over all
   **4 083 winning numbers — 845.3 KB per request, for one ticket**.
4. **The polled endpoints were `no-store`.** `/api/live` and `/api/results/today` (87 047 B per
   read) are polled every 10–30 s by every open tab and every visitor, with each poll a live
   database read on a cold lambda instance.
5. **The in-memory cache is per-instance** (`lib/cache.ts`), so on serverless it is cold exactly
   when traffic is spread across instances — which is why the HTTP cache headers, not the process
   cache, had to carry the fix.

## 2. Files / endpoints responsible

| Egress source | File |
| --- | --- |
| `rawText` on every draw read | every `include:` on `prisma.draw` (192 files' worth of call sites) — fixed centrally in `lib/prisma.ts` |
| Uncached historical pages | `astro/lib/cache-headers.ts`, `astro/pages/kerala-lottery-result/[date].astro`, `astro/pages/results/[slug]/[drawNumber].astro`, `astro/pages/kerala-lottery-results/**`, `astro/pages/previous-results.astro`, `astro/pages/prize-structure.astro`, `astro/pages/lottery-calendar.astro` |
| Ticket checker | `app/api/tickets/check/route.ts` |
| Polled endpoints | `app/api/live/route.ts`, `app/api/results/today/route.ts`, `lib/results/today-snapshot.ts` |
| Oversized payloads | `lib/results/projections.ts` (new), `components/pages/{LotterySchemePage,ResultsHub,KeralaLotteryResultsIndexPage}.tsx`, `lib/home-data.ts`, `components/HeroTodayCard.tsx` |
| Secondary API payloads (final pass) | `app/api/results/latest/route.ts`, `app/api/tickets/watchlist/route.ts`, `app/api/results/date/[date]/route.ts`, `app/api/results/[id]/route.ts`, `app/api/lotteries/[slug]/route.ts` |

## 3. Before vs after database query count

| Read path | Before | After |
| --- | --- | --- |
| Ticket check (one ticket) | 11 queries; 4 083 winning-number rows | **2 queries**; 0 rows for a loser, ≤ a few for a winner |
| Today snapshot | 3 queries, full prize trees | 3 queries, head-of-tier only (`_count` for consolation) |
| Date result page | 2 queries (1 full draw + adjacent dates) | same count, 51.4% fewer bytes |
| Scheme page | 1 query returning 15 full prize trees | 2 queries: 1 full tree + 14 headline cards |
| Archive index | 4 queries incl. a **1 848-row** date scan | 4 queries; the scan is now a **~60-row SQL aggregate** |
| Live endpoint | 4 queries per cold instance per 5 s | same queries, now shared across all users by the CDN |

## 4. Before vs after API response size (measured, same database, same process)

| Read path | Before | After | Change |
| --- | --- | --- | --- |
| today snapshot — todayDraw (full result) | 84.5 KB | **3.7 KB** | −95.6% |
| today snapshot — latestDraw ("previous result") | 84.5 KB | **0.1 KB** | −99.8% |
| date result page (1 draw, full prize tree) | 84.5 KB | **41.1 KB** | −51.4% |
| scheme page (1 full draw + 14 cards) | **1 115.0 KB** | **53.1 KB** | −95.2% |
| homepage / results hub (25 draws) | 192.5 KB | **46.4 KB** | −75.9% |
| archive index (30 draws) | 187.7 KB | **19.2 KB** | −89.8% |
| `/api/results/latest` (25 draws, summary cards) | 192.5 KB | **22.8 KB** | −88.2% |
| watchlist — latest draw per saved scheme | 74.0 KB | **15.9 KB** | −78.5% |
| ticket check (10 draws / one ticket) | 845.3 KB | **0.0 KB** | −100% |

The date endpoint keeps full prize trees (the previous-results page renders complete prize tables),
so its win is the miss *rate*, not the payload: one origin miss costs **58.0 KB** (the busiest
date, 2 draws) and now happens once per **15 s** window instead of once per 5 s.

Live HTTP verification against the local production build:

* `/api/results/today` → **625 B** body (production baseline: 87 047 B), `s-maxage=15`.
* `/api/results/latest?limit=25` → **23 368 B** (was 192.5 KB): 1 prize tier and 1 winning number per
  draw, no `rawText`, shape identical to the server-rendered cards.
* `/api/results/date/<today>` → `s-maxage=15, stale-while-revalidate=45` + `Vercel-CDN-Cache-Control`.
* `/api/results/<unknown-id>` → 404 (previously an uncached full-tree lookup per probe).
* `/api/tickets/check?ticket=WA123456` → **1 716 B** body, `private, max-age=120`.
* `/robots.txt` → 1 019 B, `/sitemap.xml` → 4 995 B gzipped (112 KB raw, 1 848 result URLs).

Reproduce with `npm run egress:report` (`scripts/egress-report.mjs`).

## 5. Before vs after cache behaviour (verified from response headers, not assumed)

| Route | Before (production) | After |
| --- | --- | --- |
| `/kerala-lottery-result/2026-09-28` | `private, no-cache, no-store` — MISS every hit | `public, s-maxage=86400, stale-while-revalidate=604800` + `Vercel-Cache-Tag: draw-date:2026-09-28,results` |
| `/results/[slug]/[drawNumber]` | `no-store` | `s-maxage=86400` when the draw is OFFICIAL, 300 s while PROVISIONAL, tagged |
| `/kerala-lottery-results` (archive index) | `no-store` (Astro) / MISS (prod) | `s-maxage=300, swr=3000`, tag `results` |
| `/kerala-lottery-results/YYYY`, `/YYYY/MM` | `no-store` | `s-maxage=3600, swr=36000`, tag `results` |
| `/previous-results`, `/prize-structure`, `/lottery-calendar` | `no-store` | `s-maxage=3600, swr=36000` |
| `/lottery/[slug]` | `s-maxage=300` | `s-maxage=3600` + `lottery:<slug>` tag |
| `/api/live` | `no-store` | `public, s-maxage=10, stale-while-revalidate=30` |
| `/api/results/today` | `s-maxage=5` (no CDN override) | `public, s-maxage=15, swr=45` + `Vercel-CDN-Cache-Control` |
| `/api/results/date/[date]` (today) | `s-maxage=5`, 5 s instance cache | `s-maxage=15, swr=45` + `Vercel-CDN-Cache-Control`, 15 s instance cache, stale-if-error |
| `/api/results/[id]`, `/api/lotteries/[slug]` | CDN header only — every edge miss was a full prize-tree read | + 300 s in-process cache on the same window as the CDN header, stale-if-error, nulls cached |
| `/api/tickets/check` | `public, max-age=0, must-revalidate` | `private, max-age=120, swr=600` — browser only, never the shared CDN |
| `/search`, `/my-tickets`, `/my-lotteries`, `/notification-settings` | `no-store` | unchanged (request-specific state) |

## 6. Before vs after live polling load

Origin database reads are now **decoupled from visitor count** — the shared CDN window, not the
number of open tabs, decides them.

| Concurrent users | `/api/live` origin reads (before) | `/api/live` origin reads (after) |
| --- | --- | --- |
| 100 | ~60/s (5 s in-process cache, per instance only) | ~6/min (one per 10 s window) |
| 1 000 | ~600/s | ~6/min |
| 10 000 | pool exhaustion / `EMAXCONNSESSION` | ~6/min |

Same shape for `/api/results/today` (one origin read per 15 s window) and for historical pages
(one render per URL per 24 h; 1 848 draw URLs + ~60 month archives are the entire working set).
Local load measurement against the production build: `/api/results/today` 500 requests @ conc 50 →
0 failures, p50 14 ms, 858 rps; `/api/live` 300 requests @ conc 30 → p50 7 ms, 4 110 rps.

## 7. Database indexes added / changed

**No index changes were required — verified against the actual query plans' access paths.**
The ticket-checker rewrite is the only new access pattern, and it is a pure index lookup:

```
WinningNumber.number IN (...)  →  @@index([number])            (existing)
prize.drawId IN (...)          →  @@index([drawId]) on Prize   (existing)
```

All other hot reads already had `Draw(status, drawDate)`, `Draw(lotteryId, drawDate)`,
`Draw(drawDate)`, `Draw(drawNumber)`, `Lottery(slug)` (unique), `Prize(drawId)`,
`WinningNumber(prizeId|number|displayNumber)`.

*Optional, not auto-applied* (needs a migration you approve; not required at current volume):

```sql
CREATE INDEX IF NOT EXISTS "WinningNumber_number_prizeId_idx"
  ON "WinningNumber" ("number", "prizeId");
```

## 8. Cache strategy

Three windows, expressed once in `astro/lib/cache-headers.ts` (`REVALIDATE`) and emitted to both
`Cache-Control` and `Vercel-CDN-Cache-Control`:

* **LIVE (30 s)** — homepage, live page, today's result: the only surfaces that change during the
  draw window.
* **RESULT_PAGE (300 s)** — archive indexes and provisional draws.
* **CONTENT (3600 s)** — catalogs, guides, news, month archives, sitemap and robots.
* **HISTORICAL (86 400 s + 7 d SWR)** — gazetted pages, whose content cannot change again.

Below the CDN, `lib/cache.ts` keeps its SWR + stale-if-error behaviour per instance, and
`lib/prisma.ts` now omits the audit columns at the client level so no future call site can
reintroduce the `rawText` leak by forgetting a projection.

## 9. Invalidation strategy

`lib/cache-purge.ts`, called from the single write path (`persistDrawResult`, after the transaction
commits):

1. In-process: `api_results_today`, `api_live_state`, `home`, `archive`, `results` (+
   `api_results_latest` on official publication).
2. CDN: targeted `Vercel-Cache-Tag` purge — `draw-date:<date>`, `lottery:<slug>`, `live`, and
   `results` only for OFFICIAL/upgraded draws. A provisional update never evicts immutable archive
   pages, and a publication never triggers a site-wide purge.
3. Best-effort by design (`VERCEL_CACHE_PURGE_TOKEN` + `VERCEL_PROJECT_ID`); a purge failure can
   never roll back a stored result. Without a token, staleness is still bounded by the windows in
   section 8.

## 10. Ticket check optimization

`app/api/tickets/check/route.ts` was rewritten from "download everything, loop in JS" to an indexed
candidate lookup: resolve the draw identities (no prize tree), normalize each ticket once, collect
only the numbers that can possibly match (the 6-digit number and its 4-digit ending), issue **one**
`winningNumber.findMany` scoped by `number IN (...)` and `prize.drawId IN (...)`, then apply the
**same three match rules in the same precedence order** over that small candidate set.
`normalizeTicketInput` is unchanged and still exported; the POST rate limit is unchanged.
Measured: 845.3 KB → 0.0 KB (loser), 4 083 rows → 0, `tests/ticket-checker.test.ts`,
`tests/multi-ticket-scanner.test.ts` and `tests/scanner-and-permissions.test.ts` all pass.

## 11. Ingestion optimization

Verified, not rewritten (the pipeline is load-bearing and the rules were already correct):

* **Idempotent writes** — `Draw` has `unique(lotteryId, drawDate)` and `unique(lotteryId, drawNumber)`;
  `persistDrawResult` upserts by date, so a duplicate cron run updates the same row instead of
  creating a second result.
* **Transactional prizes** — `prize.deleteMany` + `insertPrizesForDraw` run inside the same
  transaction as the draw write, so a crash cannot publish a partial prize table.
* **Trust gate** — OFFICIAL outranks PROVISIONAL; a provisional source can never create, modify or
  downgrade an official record; upgrades happen in place; notifications fire only for
  OFFICIAL and only for new/upgraded results.
* Both sources (LOTIS gazette = OFFICIAL, keralalotteries.net = PROVISIONAL) still funnel through
  this one writer, and the Gazette remains authoritative.

Reads got cheaper, writes were left alone.

## 12. Storage optimization

* **No PDFs (or any binary) are stored in Postgres** — the schema has no `Bytes`/`@db.Byte` columns;
  documents are referenced by `sourceDocumentUrl`.
* The only document payload in the database is `rawText` (≤ 20 KB/draw, 13.67 MB total). It is
  retained as the audit trail and is now **never selected** — the omission is declared centrally in
  `lib/prisma.ts`, so it cannot leak back in through an `include`.
* No Supabase Storage bucket is used, and nothing needs one.

## 13. Security considerations

* **Not fixed here (must be done by you, and it is the highest residual risk):** the database
  password was exposed at some point and production still connects through the Supabase **session
  pooler on 5432 with `connection_limit=10`**. Rotate the password and move `DATABASE_URL` to the
  6543 transaction pooler in the Vercel dashboard.
* Ticket-check responses are `private` (browser-cached at most) so one visitor's ticket number can
  never be served to another from a shared cache.
* The GET checker remains rate-unlimited (unchanged), but it is now ~0 bytes of database work per
  call, so its abuse value as an egress amplifier is gone. Consider extending
  `checkRateLimit` to GET as a follow-up.
* Cache tags are emitted only on public pages; the purge token is read from the environment and
  used server-side only.
* `robots.txt` still disallows `/api/`, `/search`, `/my-*`, `/notification-settings` while allowing
  legitimate crawlers and answer engines — unchanged policy, now present on the Astro branch too.

## 14. SEO impact

* Every existing URL, canonical, `robots.txt` rule, structured-data block and SSR HTML response is
  intact; no `noindex` was added anywhere. Provisional pages keep their pre-existing noindex logic.
* **Gap closed:** the Astro branch had no `/sitemap.xml` or `/robots.txt` route at all. Both now
  exist and reuse the Next builders (`app/sitemap.ts`, `app/robots.ts`) as the single source of
  truth, so the index keeps all 1 848 result URLs, the hreflang alternates and the verified-only
  `lastmod` values (`verificationLevel: 'OFFICIAL'`).
* Historical pages now answer from the CDN, which *improves* crawl efficiency: crawlers no longer
  queue behind a live database render on every URL.

## 15. Build / typecheck / lint results

| Gate | Result |
| --- | --- |
| `npm run check` (astro check, 221 files) | **0 errors** |
| `npm test` (vitest, 24 files) | **180 / 180 passing** |
| `npm run build` (prisma generate + astro build) | **success** |
| `npm run lint` | **0 errors**, 3 warnings |

Three pre-existing problems had to be fixed to make the gates meaningful: two type errors
(`astro/middleware.ts` Buffer→BodyInit, the Prisma client's omit typing in `lib/prisma.ts`), two
test files that still pointed at `app/(en)/**` paths deleted by the Astro migration, and
`eslint.config.mjs` not ignoring `dist/**` / `.vercel/**` (which produced ~4 200 phantom findings
against minified bundles).

## 16. Remaining bottlenecks

1. **Production still serves the Next app from `main`.** Everything in this report applies to the
   `astro` branch. Until that branch is deployed (or mirrored onto `main`), live egress is
   unchanged.
2. History pages are CDN-cached but still server-rendered on a miss (measured p50 ≈ 247 ms locally
   with the database warm — the cost is React SSR + gzip, not the query). ISR/pre-rendering would
   remove even that.
3. The full-tree routes that remain (`/api/results/date/[date]`, `/api/results/[id]/[drawNumber]`,
   `/api/results/lottery/[lottery]`, `/api/lotteries/[slug]`) keep that shape deliberately: their
   consumers render complete prize tables, so trimming them would change public API contracts for
   no usable win. Everything summary-shaped — `/api/results/latest`, `/api/results/history`,
   `/api/tickets/watchlist`, `/api/search`, `/api/lotteries` — now runs on projections, and the
   routes with no in-process cache gained one. The remaining lever here is contract design (a
   versioned slim API), not query tuning.
4. The archive index still issues 4 queries per uncached render (the 1 848-row scan is now a 60-row
   aggregate).
5. **`assessCompleteness()` in `app/api/live/route.ts` reads `prize.tierNumber`, which does not exist
   on the `Prize` model** — `isComplete` is therefore always false, so provisional draws keep the
   fastest client poll (10 s) for longer than intended. Pre-existing, and a real polling-load lever;
   it needs a decision about the intended tier source (`orderIndex`/`category`) before changing.
6. `sync-live` still runs every minute via pg_cron. If egress is still tight after deploy, that
   cadence — not the read paths — is the next dial.
7. Vercel tag invalidation needs a token and plan support; without it, staleness falls back to the
   `s-maxage` windows.

## 17. Changes not safe to apply automatically

1. **Rotate the leaked database password and switch the pooler port to 6543** (dashboard-only).
2. **Deploy (or mirror) the `astro` branch** — the single most important operational step.
3. **Configure `VERCEL_CACHE_PURGE_TOKEN` + `VERCEL_PROJECT_ID`** and confirm tag invalidation is
   available on the plan.
4. Optional `WinningNumber(number, prizeId)` composite index (migration + apply on the database).
5. Dropping the `rawText` column to reclaim ~13.7 MB — deliberately *not* done: it is the audit trail
   for published results, and it is already free on the read path.
6. Deciding the correct tier source for `assessCompleteness` (item 16.5).

---

**Verification statement.** No claim here rests on "it builds". Query counts, byte counts, cache
headers and load behaviour were measured against the production database and against a local
production build, before and after, and the measurement tool ships with the repo
(`npm run egress:report`).
