# Movie Library

A movie library web application — React + TypeScript frontend, Node.js + TypeScript (Express + Prisma) backend, PostgreSQL, Dockerized.

> **Status:** project scaffold only. Authentication, movie CRUD, search/filtering,
> seed data, and forms have not been built yet — see `DECISIONS.md` (coming once
> those land) for the architecture and trade-offs behind this setup.

## Stack

- **Frontend:** React, TypeScript, Vite, TanStack Query, React Router, Tailwind CSS
- **Backend:** Node.js, TypeScript, Express, Prisma, PostgreSQL
- **Auth:** JWT in an httpOnly cookie (not yet implemented)
- **Tests:** Vitest (+ Supertest on the API, React Testing Library on the client)

## Running with Docker (recommended)

```bash
cp .env.example .env
docker compose up --build
```

- Client: http://localhost:3000
- API: http://localhost:4000 (health check at `/api/health`)
- Postgres: `localhost:5432` (credentials from `.env`)

There is no data model yet, so there's nothing to migrate or seed — once the
Prisma schema exists, that step will be:

```bash
docker compose exec server npx prisma migrate deploy
docker compose exec server npm run prisma:seed
```

## Running locally without Docker

Requires Node.js 20+ and a running Postgres instance (the easiest way to get
one is `docker compose up postgres`).

**Backend:**

```bash
cd server
cp .env.example .env   # point DATABASE_URL at your Postgres instance
npm install
npm run dev             # http://localhost:4000
```

**Frontend:**

```bash
cd client
cp .env.example .env
npm install
npm run dev             # http://localhost:5173
```

## Tests

```bash
cd server && npm test
cd client && npm test
```

## Linting & formatting

Each app has its own ESLint config (`npm run lint`) and a shared Prettier
config (`npm run format`).
