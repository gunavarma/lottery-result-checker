# Public results data strategy

## Decision

Use **Supabase Postgres only as the authoritative write store**. Do not serve
ordinary public page views or client polling directly from it. Each successful
result import publishes small, versioned JSON snapshots to Cloudflare R2; the
site serves those snapshots through Cloudflare's edge cache.

This keeps the relational database for ingestion, search, ticket watchlists and
administration, while removing public read traffic from Supabase egress.

## Why the current design exhausts egress

The audit found these high-volume paths:

- `/api/results/today` is polled during the live window and previously returned
  every winning-number row for both today and the latest draw.
- Result lists commonly use Prisma `include`, which returns every scalar of a
  draw. The `rawText` audit column can contain up to 20 KB of source text and
  must never travel in a public response.
- Serverless memory caching is per function instance. It does not share a hit
  across regions or instances, so it cannot be the egress control plane.
- Historical API routes currently use short cache windows even though official
  published draws are effectively immutable.

## Snapshot contract

Publish after a verified import, never on page view:

```
results/latest.json                 # 12-card latest-results list
results/today.json                  # live hero, one number per prize + counts
results/dates.json                  # available date navigator
results/date/YYYY-MM-DD.json        # complete immutable prize table
results/version.json                # monotonically increasing version + updatedAt
```

The browser and page server request the public object URL, not Supabase. Cache
rules are intentionally different by object:

| Object | Browser / edge cache | Refresh trigger |
| --- | --- | --- |
| `today.json` | 10 seconds / 60 seconds stale | live importer publishes change |
| `latest.json`, `dates.json` | 5 minutes / 24 hours stale | result importer publishes change |
| `date/*.json` | 1 day / 7 days stale | only correction or verification upgrade |

Use a content hash (or version) in the importer. If the JSON is unchanged, do
not upload it and do not purge cache. This makes idle cron runs nearly free.

## Free-tier fit (checked 4 October 2026)

- Supabase Free provides 500 MB database space, 5 GB egress and 5 GB cached
  egress per project. It remains suitable as the small write store, but not as
  the public CDN. <https://supabase.com/pricing>
- Cloudflare R2 provides 10 GB-month storage, 1 million Class A operations and
  10 million Class B operations monthly on its free tier; Internet egress is
  free. It is the best fit for immutable public result snapshots.
  <https://developers.cloudflare.com/r2/pricing/>
- Cloudflare Workers Free provides 100,000 requests/day and no data-transfer
  charge. Use it only for the snapshot read/proxy and a small publish endpoint,
  not for HTML rendering or database access. <https://developers.cloudflare.com/workers/platform/pricing/>
- Vercel Cron is available on Hobby, but Hobby schedules run only once daily
  and can be up to 59 minutes late. It is unsuitable for live-result polling.
  <https://vercel.com/docs/cron-jobs/usage-and-pricing>
- GitHub Actions is free for public repositories on standard hosted runners.
  For a private repository, it consumes the account's included monthly minutes;
  it is useful for a daily repair/backfill, not the live draw window.
  <https://docs.github.com/en/billing/concepts/product-billing/github-actions>

No provider offers unlimited free compute, storage and requests. This design
keeps normal public traffic in R2's free egress path, with explicit quotas and
an inexpensive future upgrade path if traffic exceeds them.

## Free scheduling plan

1. Keep the existing official-import job as the source-of-truth writer.
2. Trigger it from Supabase `pg_cron` only in the 15:00–19:00 IST publication
   window; outside that window run once daily for repair/backfill.
3. A GitHub Actions scheduled workflow can call the authenticated repair route
   once daily as a secondary safety net. Do not depend on Vercel Hobby for the
   live window.
4. After a changed import, publish snapshots once. The public website never
   needs a cron job to read data.

## Implementation order

1. **Completed in this branch:** omit `Draw.rawText` from all Prisma read
   results and reduce the live hero payload to one winner per prize plus a
   relation count.
2. Add an R2 publisher to the successful importer path, guarded by object
   hashes and retry-safe idempotency.
3. Add a Worker route (or public R2 custom domain) with immutable cache headers
   and migrate `/api/results/latest`, `/today`, `/dates` and `/date/:date` to
   snapshots first.
4. Convert historical HTML routes to read the same date snapshot; retain a
   Supabase fallback only for administrators and an R2-miss recovery path.
5. Add an egress dashboard: request count, R2 object hits, snapshot age,
   Supabase fallback count and bytes per endpoint. Alert if fallback is nonzero
   for more than five minutes.

## Required configuration for phase 2

The following must be provided through deployment secrets, never committed:

- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET`
- `RESULT_SNAPSHOT_BASE_URL`

Cloudflare account creation and DNS/custom-domain changes are external account
actions, so they require owner approval before implementation.
