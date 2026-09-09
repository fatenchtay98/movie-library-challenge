#!/bin/sh
set -e

# Render sets $PORT for whatever nginx should bind to; the node server always
# stays on a fixed internal port (4000, never exposed) so the two can't
# collide over which process reads Render's PORT.
envsubst '${PORT}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf

PORT=4000 node dist/server.js &

# nginx as PID 1 (exec) ties container lifecycle to it; if the node process
# dies, /api requests fail but the container keeps running rather than
# restarting — acceptable for this scope, not a production process
# supervisor.
exec nginx -g 'daemon off;'
