# Kerala Lottery Results Platform

A production-ready Kerala lottery results platform built with **Next.js 16 (App Router)**, **TypeScript**, **PostgreSQL (Supabase)**, **Prisma ORM**, **Supabase Cron (`pg_cron`)**, **Supabase Edge Functions**, and **Firebase Cloud Messaging (FCM)**.

The website automatically retrieves and verifies official lottery results directly from the **Lottery Information and Management System (LOTIS)** operated by the **Directorate of Kerala State Lotteries, Government of Kerala**, and dispatches automated browser push notifications to subscribed users upon official result publication.

---

## 1. System Architecture

```
                                  USERS
                                    |
                                    v
                                VERCEL
                          (Frontend & UI)
                                    |
                                    v
                            SUPABASE DATABASE
                              (PostgreSQL)
                                    ^
                                    |
                          Supabase Edge Function
                          (check-lottery-results)
                                    ^
                                    |
                            Supabase pg_cron
                          (Runs every 15 mins)
                                    |
                                    v
                        Official LOTIS Source
                    (lotteryagent.kerala.gov.in)
                                    |
                                    v
                             Result Validation
                                    |
                               New Result?
                                /       \
                              NO         YES
                              |           |
                             STOP         v
                                      DATABASE
                                          |
                                +---------+---------+
                                |                   |
                                v                   v
                             WEBSITE               FCM
                                                    |
                                                    v
                                                  USERS
```

### Result Notification Flow & Safeguards
- **Zero Fabrication**: Notifications are triggered **only** after an official signed gazette is retrieved from LOTIS, parsed, schema-validated, and committed to PostgreSQL.
- **Selective Subscriptions**: Users can subscribe to all lotteries or select individual schemes (e.g. *Suvarna Keralam*, *Karunya Plus*, *Akshaya*).
- **Duplicate Delivery Prevention**: Unique database constraints `[lotteryId, drawNumber]` in `Draw` and `[resultId, pushSubscriptionId]` in `NotificationDelivery` ensure results and notifications are never duplicated.
- **Automated Invalid Token Cleanup**: FCM errors `messaging/registration-token-not-registered` or `messaging/invalid-registration-token` automatically deactivate the token in the database.
- **No Forced Accounts**: Anonymous device subscriptions without requiring email, phone number, or login.

---

## 2. Supabase Cron & Edge Function Setup

### Step 1: Deploy Database Migration
Run the SQL migration in `supabase/migrations/20260828000000_supabase_cron_and_watchlist.sql` using Supabase SQL Editor or Supabase CLI:
```bash
supabase db push
```

### Step 2: Deploy Edge Function
```bash
supabase functions deploy check-lottery-results --no-verify-jwt
```

### Step 3: Set Edge Function Secrets
```bash
supabase secrets set SUPABASE_URL="https://<YOUR_PROJECT_REF>.supabase.co"
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="<YOUR_SERVICE_ROLE_KEY>"
supabase secrets set CRON_SECRET="kerala-lottery-cron-secure-token-2026"
supabase secrets set LOTIS_BASE_URL="https://www.lotteryagent.kerala.gov.in"
```

---

## 3. Environment Variables

Create `.env` based on `.env.example`:

```env
# ==========================================
# Database & Core Application Secrets
# ==========================================
DATABASE_URL="postgresql://postgres:password@localhost:5432/kerala_lottery?schema=public"
CRON_SECRET="kerala-lottery-cron-secure-token-2026"
ADMIN_SECRET="admin-kerala-lottery-2026"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"

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
| `/api/cron/sync-results` | `GET` | Next.js fallback / manual cron synchronization runner |
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
