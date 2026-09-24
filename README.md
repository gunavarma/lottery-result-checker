# Kerala Lottery Results Platform

A production-ready Kerala lottery results platform built with **Next.js 16 (App Router)**, **TypeScript**, **PostgreSQL (Supabase)**, **Prisma ORM**, **Supabase Cron (`pg_cron`)**, **TanStack Query**, and **Firebase Cloud Messaging (FCM)**.

The website automatically retrieves and verifies official lottery results directly from the **Lottery Information and Management System (LOTIS)** operated by the **Directorate of Kerala State Lotteries, Government of Kerala**, and dispatches automated browser push notifications to subscribed users upon official result publication.

---

## 1. System Architecture

There is exactly **one** synchronization pipeline. It is owned by the Next.js
application so that the parser, Zod validation, audit tables, cache
invalidation, and notification dispatch cannot drift apart:

```
                        Official LOTIS Portal
                    (lotteryagent.kerala.gov.in)
                                 ^
                                 |
                    Supabase pg_cron (every 15 min)
                    + Vercel Cron (daily safety net)
                                 |
                                 v
                GET /api/cron/sync-results   <-- Bearer CRON_SECRET
                                 |
                                 v
                 lib/lotis/sync.ts
                   - LOTIS listing  -> source item id
                   - Gazette PDF    -> SHA-256 hash
                   - parser         -> structured tiers
                   - Zod validation -> reject incomplete/unsafe data
                   - prisma.$transaction -> atomic UPSERT (idempotent)
                                 |
                                 v
                          PostgreSQL  (source of truth)
                                 |
                    +------------+------------+
                    |                         |
                    v                         v
          in-memory SWR cache             FCM notifications
             (optimization)              (only after commit)
                    |
                    v
              API routes  ->  TanStack Query  ->  UI
```

**Read path (what users experience):** the browser only ever calls our own
API routes, which read from PostgreSQL. A user session never triggers a LOTIS
fetch, never downloads a gazette, and never parses a PDF. Expensive work only
happens in the background pipeline, and the UI always renders stored data first
before revalidating in the background.

> The Supabase Edge Function `check-lottery-results` is **deprecated**: it is an
> older duplicate of this pipeline with a weaker parser. Migration
> `20260913000000_consolidate_cron_pipeline.sql` removes it from the schedule.

### 1.1 Two-tier trust model (live vs official)

Kerala lottery numbers appear on third-party live sites (notably
`keralalotteries.net`) from about **2:55 PM IST**, well before the official
gazette is published around **4:30 PM IST**. KeralaDraws uses that source to be
fast, while guaranteeing it can never be mistaken for the official record:

| Tier | Source | Written as | Indexed | Notified | Authoritative |
|---|---|---|---|---|---|
| **OFFICIAL** | LOTIS gazette PDF | `verificationLevel: 'OFFICIAL'` | yes | yes | yes |
| **PROVISIONAL** | keralalotteries.net (unofficial) | `verificationLevel: 'PROVISIONAL'` | no (`noindex`) | no | no |

Rules enforced in one place, `lib/results/persist.ts`:

1. **OFFICIAL always outranks PROVISIONAL.** A provisional write can never
   create, modify or downgrade an official row — not even with `force`.
2. **`PROVISIONAL → OFFICIAL` is an in-place upgrade of the same row**, so the
   live source never produces duplicate historical records.
3. A provisional row may be rewritten repeatedly while it stays provisional,
   because tiers are published incrementally (1st prize first, 4th–9th later).
4. **Prize amounts are never taken from the unofficial source.** They are
   derived from the scheme's most recent official draw; a disagreement is
   logged as an `ImportError` instead of being published.
5. Provisional results are **excluded from the sitemap**, marked `noindex`, and
   **never trigger a push notification**.
6. Provisional results are clearly labelled in the UI (`LIVE • UNOFFICIAL`) and
   are never described as certified.

**Freshness:** the live poller runs every minute during 14:30–18:29 IST, so our
database is at most ~60s behind the source, and the live page polls our own API
every 10s during the window. Typical end-to-end latency is ~30s; worst case is
just over a minute. A truly instantaneous update would require a push feed from
the source, which it does not provide.

**Attribution and legality:** `keralalotteries.net/robots.txt` explicitly allows
crawling (only `/search` and `/share-widget` are disallowed). The crawler
identifies itself, times out, backs off, and uses conditional GETs. The source
can be disabled instantly with `KERALALOTTERIES_ENABLED=false`, after which only
the official gazette pipeline runs.

### Result Notification Flow & Safeguards
- **Zero Fabrication**: Notifications are triggered **only** after an official signed gazette is retrieved from LOTIS, parsed, schema-validated, and committed to PostgreSQL.
- **Selective Subscriptions**: Users can subscribe to all lotteries or select individual schemes (e.g. *Suvarna Keralam*, *Karunya Plus*, *Akshaya*).
- **Duplicate Delivery Prevention**: Unique database constraints `[lotteryId, drawNumber]` in `Draw` and `[resultId, pushSubscriptionId]` in `NotificationDelivery` ensure results and notifications are never duplicated.
- **Automated Invalid Token Cleanup**: FCM errors `messaging/registration-token-not-registered` or `messaging/invalid-registration-token` automatically deactivate the token in the database.
- **No Forced Accounts**: Anonymous device subscriptions without requiring email, phone number, or login.

---

## 2. Automated Scheduling Setup

The authoritative scheduler is **Supabase `pg_cron`**, which calls the
Next.js pipeline every 15 minutes. This is what covers the actual result
publication window (approximately 3:00 PM – 5:00 PM IST) with repeated,
idempotent checks.

The **Vercel Cron** entries in `vercel.json` are a daily safety net only: the
Hobby plan restricts cron to once per day and two jobs, so it cannot provide
the required intra-day cadence on its own. On a Vercel Pro plan you may tighten
`/api/cron/sync-results` to `*/15 9-14 * * *` (UTC = IST − 5:30) and keep
`pg_cron` as the redundancy.

### Step 1: Deploy Database Migrations
```bash
supabase db push
```
This applies the watchlist schema, the `sync_runs` audit table, and
`20260913000000_consolidate_cron_pipeline.sql`, which retires the deprecated
edge-function job.

### Step 2: Configure the sync jobs
Two jobs share the same configuration: the official gazette sync every 15
minutes, and the provisional live poller every minute during the publication
window. One command schedules both, and registers the credential they present:
```bash
node --env-file=.env scripts/configure-automation-cron.mjs
```

> **Do not use `ALTER DATABASE postgres SET app.settings.*`.** It fails on this
> project with SQLSTATE 42501 (the `postgres` role is not a superuser). That is
> exactly why the older migrations never scheduled anything and the pipeline sat
> dead while reporting success — every run was POSTing to a deleted Edge Function
> and getting HTTP 404. The script above inlines the configuration into the job
> bodies instead, which needs no elevated privileges.

**Credential:** the jobs authenticate with `CRON_SECRET`. The app also accepts a
credential stored in `automation_credentials` (hash only, never the plaintext),
which is what the script registers. This second source exists because rotating a
Vercel environment variable requires dashboard access plus a redeploy; with the
stored credential the pipeline keeps running and the secret rotates by
re-running the script. Both sources are validated in constant time and the
endpoint fails closed (503) when neither is usable.

### Step 3: Generate the automation secrets
Never use the previously documented placeholder values — they are public and
are rejected in production. Generate strong secrets locally and copy them into
Vercel / Supabase:
```bash
npm run generate-secrets
```

> The deprecated `check-lottery-results` edge function is no longer scheduled.
> If you keep it deployed as an emergency manual fallback, redeploy it as-is
> (`supabase functions deploy check-lottery-results --no-verify-jwt`); it now
> fails closed unless a valid `CRON_SECRET` or service-role key is presented.

---

## 3. Environment Variables

Create `.env` based on `.env.example`:

```env
# ==========================================
# Database & Core Application Secrets
# ==========================================
# Generate with: npm run generate-secrets  (never commit real values)
DATABASE_URL="postgresql://postgres:password@localhost:5432/kerala_lottery?schema=public"
CRON_SECRET="<generated-32-byte-random-secret>"
ADMIN_SECRET="<generated-32-byte-random-secret>"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"

# ==========================================
# Unofficial live result source (optional)
# ==========================================
# Set ENABLED=false to fall back to the official gazette pipeline only.
KERALALOTTERIES_ENABLED="true"
KERALALOTTERIES_BASE_URL="https://www.keralalotteries.net"

# ==========================================
# Supabase Edge Functions Configuration
# ==========================================
SUPABASE_URL="https://<YOUR_PROJECT_REF>.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="<YOUR_SERVICE_ROLE_KEY>"

# ==========================================
# Firebase Web Client Configuration (PUBLIC)
# ==========================================
NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSyDemoDummyApiKeyForFirebase12345"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="kerala-lottery-results.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="kerala-lottery-results"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="kerala-lottery-results.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="123456789012"
NEXT_PUBLIC_FIREBASE_APP_ID="1:123456789012:web:abcdef1234567890"
NEXT_PUBLIC_FIREBASE_VAPID_KEY="BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBKr3qBUYIhbQFLXYp5Nksh8U"

# ==========================================
# Firebase Admin SDK Credentials (SERVER ONLY)
# ==========================================
FIREBASE_PROJECT_ID="kerala-lottery-results"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@kerala-lottery-results.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
```

---

## 4. Key Endpoints & Routes

| Route | Method | Description |
|---|---|---|
| `/api/cron/sync-results` | `GET` | Official gazette synchronization (15-minute scheduler / Vercel Cron) |
| `/api/cron/sync-live` | `GET` | Provisional live poller (`?force=true`, `?date=YYYY-MM-DD`); runs every minute in-window |
| `/api/cron/keralalotteries-backfill` | `GET` | Resumable gap backfill from the live source (`?from`, `?to`, `?batch`, `?restart`) |
| `/api/admin/sync` | `POST` | Protected manual sync trigger for administrative users |
| `/api/notifications/register` | `POST` | Register FCM registration token & selected lotteries |
| `/api/notifications/register` | `PUT` | Update selected lottery preferences for an FCM token |
| `/api/notifications/register` | `DELETE` | Unsubscribe/deactivate FCM token |
| `/api/notifications/test` | `POST` | Protected admin test notification dispatcher |
| `/notification-settings` | `GET` | User notification preferences & lottery selector page |
| `/admin` | `GET` | Operational dashboard with live synchronization & FCM telemetry |

---

## 5. Verification & Testing

```bash
# Run unit test suite
npm test

# Build production bundle
npm run build
```
