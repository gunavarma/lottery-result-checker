#!/bin/sh
# Launchd wrapper: starts the KeralaDraws production preview server.
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
export HOME="/Users/guna"
export VERCEL=1  # disable the dev-only in-process result scheduler
export PORT="${PORT:-3401}"
cd /Users/guna/Documents/lottery-result-checker || exit 1
# `--env-file=.env` is required: the standalone server does not read `.env`
# on its own, so without it DATABASE_URL / ADMIN_PASSWORD never reach the
# process. (`astro dev` does load `.env`; this entry point does not.)
exec node --env-file=.env server.mjs
