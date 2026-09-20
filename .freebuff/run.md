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

## Notes

- Registering preview: `register_preview` with `http://127.0.0.1:<port>` and the server pid.
- `.freebuff/preview-start.sh` is the launchd-safe wrapper (sets PATH, HOME, VERCEL=1).
