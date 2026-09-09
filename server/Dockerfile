# node:24-slim (Debian), not alpine: Prisma's query engine needs glibc/OpenSSL
# that alpine's musl libc doesn't provide out of the box.

FROM node:24-slim AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm install

FROM deps AS build
COPY . .
# `prisma generate` doesn't connect to a database, but prisma.config.ts's
# `env('DATABASE_URL')` still has to resolve just to load the config file —
# this placeholder is never used to actually connect. The real DATABASE_URL
# is injected at container start via docker-compose, for `migrate`/`db seed`.
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build"
# The generated client (src/generated/) is gitignored, so it never exists in
# a fresh checkout/build context — must regenerate here before compiling,
# rather than relying on whatever happens to be on the host's filesystem.
RUN npx prisma generate
RUN npm run build

FROM base AS runtime
ENV NODE_ENV=production
COPY package.json package-lock.json* ./
# `prisma` (the CLI) is a regular dependency, not a devDependency, on purpose:
# `docker compose exec server npx prisma migrate deploy` runs against this
# image, so the CLI has to survive --omit=dev.
RUN npm install --omit=dev
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./prisma.config.ts

EXPOSE 4000
CMD ["node", "dist/server.js"]
