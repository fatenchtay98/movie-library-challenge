#!/bin/sh
set -e

# Render sets $PORT for whatever nginx should bind to; the node server always
# stays on a fixed internal port (4000, never exposed) so the two can't
# collide over which process reads Render's PORT.
envsubst '${PORT}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf

# Render's pre-deploy command and Shell/one-off jobs (the usual places for
# this) are paid-plan-only features, so migrating and seeding both happen
# here instead. `migrate deploy` only applies pending migrations and is a
# safe no-op otherwise. seed-if-empty.mjs only actually seeds when the
# movies table is empty — this runs on EVERY container start, including a
# free-tier wake from sleep, and the underlying seed is destructive (wipes
# and regenerates movies, see DECISIONS.md), so it must not fire again once
# real data exists.
npx prisma migrate deploy
node deploy/seed-if-empty.mjs

PORT=4000 node dist/server.js &

# nginx as PID 1 (exec) ties container lifecycle to it; if the node process
# dies, /api requests fail but the container keeps running rather than
# restarting — acceptable for this scope, not a production process
# supervisor.
exec nginx -g 'daemon off;'
