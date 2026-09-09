# node:20-slim (Debian), not alpine: Prisma's query engine needs glibc/OpenSSL
# that alpine's musl libc doesn't provide out of the box.

FROM node:20-slim AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm install

FROM deps AS build
COPY . .
RUN npx prisma generate
RUN npm run build

FROM base AS runtime
ENV NODE_ENV=production
COPY package.json package-lock.json* ./
RUN npm install --omit=dev
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
RUN npx prisma generate

EXPOSE 4000
CMD ["node", "dist/server.js"]
