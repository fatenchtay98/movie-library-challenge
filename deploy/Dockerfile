# Render-only combined image: nginx + the built client + the server, all in
# one container. This is deliberately separate from client/Dockerfile and
# server/Dockerfile (which stay a 3-service docker-compose setup for local
# review) — see DECISIONS.md for why. Build context must be the repo root
# (needs both client/ and server/), so this can't live at either app's root.

FROM node:24-alpine AS client-build
WORKDIR /app/client
COPY client/package.json client/package-lock.json* ./
RUN npm install
COPY client/. .
RUN npm run build

FROM node:24-slim AS server-deps
WORKDIR /app/server
COPY server/package.json server/package-lock.json* ./
RUN npm install

FROM server-deps AS server-build
COPY server/. .
# Same reasoning as server/Dockerfile: prisma.config.ts needs DATABASE_URL to
# resolve just to load, even though `generate` never connects to a database.
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build"
RUN npx prisma generate
RUN npm run build

FROM node:24-slim AS runtime
# node:24-slim (Debian, not alpine) for the same Prisma glibc/OpenSSL reason
# as server/Dockerfile — plus nginx and envsubst (gettext-base), used to
# inject Render's dynamic $PORT into the nginx config at container start.
RUN apt-get update \
  && apt-get install -y --no-install-recommends nginx gettext-base \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
ENV NODE_ENV=production
COPY server/package.json server/package-lock.json* ./
RUN npm install --omit=dev
COPY --from=server-build /app/server/dist ./dist
COPY --from=server-build /app/server/prisma ./prisma
COPY --from=server-build /app/server/prisma.config.ts ./prisma.config.ts
# prisma/seed.ts runs via tsx against TS source, importing ../src/lib/* —
# see server/Dockerfile for the same note.
COPY --from=server-build /app/server/src ./src

COPY --from=client-build /app/client/dist /usr/share/nginx/html

COPY deploy/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY deploy/start.sh ./start.sh
RUN chmod +x ./start.sh

EXPOSE 10000
CMD ["./start.sh"]
