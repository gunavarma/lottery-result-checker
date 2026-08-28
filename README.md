# Kerala Lottery Results Platform — Firebase Cloud Messaging (FCM) Web Push

A production-ready Kerala lottery results platform built with **Next.js 16 (App Router)**, **TypeScript**, **PostgreSQL**, **Prisma ORM**, and **Firebase Cloud Messaging (FCM)**.

The website automatically retrieves and verifies official lottery results directly from the **Lottery Information and Management System (LOTIS)** operated by the **Directorate of Kerala State Lotteries, Government of Kerala**, and dispatches automated browser push notifications to subscribed users upon official result publication.

---

## 1. Firebase Cloud Messaging (FCM) Architecture

```
Official Kerala LOTIS (Authoritative Source)
                ↓
    Result Synchronization (Vercel Cron)
                ↓
      Line-by-line PDF Parser
                ↓
        Zod Schema Validation
                ↓
        PostgreSQL Database
                ↓
   Draw Record Inserted (status = 'PUBLISHED')
                ↓
      RESULT_PUBLISHED Event
                ↓
  FCM Multicast Dispatcher (lib/firebase/fcm.ts)
                ↓
  ┌─────────────┴─────────────┐
  ↓                           ↓
Background Notification   Foreground Toast
(firebase-messaging-sw.js) (ForegroundNotificationToast.tsx)
```

### Result Notification Flow & Safeguards
- **Zero Fabrication**: Notifications are triggered **only** after an official signed gazette is retrieved from LOTIS, parsed, schema-validated, and committed to PostgreSQL.
- **Selective Subscriptions**: Users can subscribe to all lotteries or select individual schemes (e.g. *Suvarna Keralam*, *Karunya Plus*, *Akshaya*).
- **Duplicate Delivery Prevention**: Unique database constraint `[resultId, pushSubscriptionId]` in `NotificationDelivery` ensures users never receive duplicate notifications for the same draw.
- **Automated Invalid Token Cleanup**: FCM errors `messaging/registration-token-not-registered` or `messaging/invalid-registration-token` automatically deactivate the token in the database.
- **No Forced Accounts**: Anonymous device subscriptions without requiring email, phone number, or login.

---

## 2. Firebase Configuration Step-by-Step Guide

### Step 1: Create a Firebase Project
1. Open the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project**, name it (e.g. `kerala-lottery-results`), and click **Create project**.

### Step 2: Register Web Application
1. In the Project Overview page, click the **Web icon (`</>`)** to add a web app.
2. Enter App nickname (e.g. `Kerala Lottery Web App`).
3. Click **Register app** and copy the `firebaseConfig` keys.

### Step 3: Generate Web Push Certificate (VAPID Key)
1. In Firebase Console, go to **Project settings (⚙️)** $\rightarrow$ **Cloud Messaging** tab.
2. Scroll to **Web configuration** $\rightarrow$ **Web Push certificates**.
3. Click **Generate key pair**.
4. Copy the public key for `NEXT_PUBLIC_FIREBASE_VAPID_KEY`.

### Step 4: Generate Firebase Admin Private Key (Server SDK)
1. In Firebase Console, go to **Project settings** $\rightarrow$ **Service accounts** tab.
2. Click **Generate new private key** $\rightarrow$ **Generate key**.
3. A JSON file will download. Extract:
   - `project_id` $\rightarrow$ `FIREBASE_PROJECT_ID`
   - `client_email` $\rightarrow$ `FIREBASE_CLIENT_EMAIL`
   - `private_key` $\rightarrow$ `FIREBASE_PRIVATE_KEY`

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
| `/api/notifications/register` | `POST` | Register FCM registration token & selected lotteries |
| `/api/notifications/register` | `PUT` | Update selected lottery preferences for an FCM token |
| `/api/notifications/register` | `DELETE` | Unsubscribe/deactivate FCM token |
| `/api/notifications/test` | `POST` | Protected admin test notification dispatcher |
| `/notification-settings` | `GET` | User notification preferences & lottery selector page |
| `/firebase-messaging-sw.js` | `GET` | Background service worker for handling Web Push alerts |
| `/admin` | `GET` | Operational dashboard with live FCM subscriber metrics |

---

## 5. Verification & Testing

```bash
# Run unit & integration test suite (26 tests)
npm test

# Run linter
npm run lint

# Run production build
npm run build
```

---

## 6. Official Disclaimer & Transparency

- **Authoritative Source**: Directorate of Kerala State Lotteries, Government of Kerala (`lotteryagent.kerala.gov.in`).
- **Legal Notice**: This platform is an independent information service and is **not affiliated with or operated by the Government of Kerala**. All participants are advised to verify winning tickets with the official Kerala Government Gazette within 90 days of the draw.
