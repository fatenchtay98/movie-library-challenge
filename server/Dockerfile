# node:24-slim (Debian), not alpine: Prisma's query engine needs glibc/OpenSSL
# that alpine's musl libc doesn't provide out of the box.

FROM node:24-slim AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm install

FROM deps AS build
COPY . .
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

# No `prisma generate` here yet — the schema has no models until the next
# phase, and `generate` errors on a model-less schema. Add it back once
# real models/migrations exist.

EXPOSE 4000
CMD ["node", "dist/server.js"]
