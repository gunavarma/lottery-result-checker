#!/bin/sh
# Launchd wrapper: starts the KeralaDraws production preview server.
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
export HOME="/Users/guna"
export VERCEL=1  # disable the dev-only in-process result scheduler
cd /Users/guna/Documents/lottery-result-checker || exit 1
exec ./node_modules/.bin/next start -p 3401
