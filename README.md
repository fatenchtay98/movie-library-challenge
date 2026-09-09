# Movie Library

A movie library web application — React + TypeScript frontend, Node.js + TypeScript (Express + Prisma) backend, PostgreSQL, Dockerized.

> **Status:** data layer, auth, and seed data are in place. Movie CRUD,
> search/filtering, and the frontend UI/forms have not been built yet — see
> `DECISIONS.md` (coming once those land) for the architecture and trade-offs
> behind this setup.

## Stack

- **Frontend:** React, TypeScript, Vite, TanStack Query, React Router, Tailwind CSS
- **Backend:** Node.js 24, TypeScript, Express, Prisma 7, PostgreSQL
- **Auth:** JWT in an httpOnly cookie (bcrypt password hashing, role-based
  authorization — see `POST/GET /api/auth/*`)
- **Logging:** pino-http (structured JSON; pretty-printed in development only)
- **Tests:** Vitest (+ Supertest on the API, React Testing Library on the client)

The client always calls relative `/api/...` URLs — nginx proxies `/api` to the
server in Docker, and Vite's dev server proxy does the same locally, so the
frontend and API are same-origin from the browser's perspective in both setups
(no CORS/cross-origin cookie complexity for the httpOnly auth cookie).

## Running with Docker (recommended)

```bash
cp .env.example .env
docker compose up --build
```

- Client: http://localhost:3000
- API health check: http://localhost:3000/api/health (proxied) or
  http://localhost:4000/api/health (direct)
- Postgres: `localhost:5432` (credentials from `.env`)

First-time setup needs one manual step — migrations and seeding are explicit,
not automatic on container start (see `DECISIONS.md`):

```bash
docker compose exec server npx prisma migrate deploy
docker compose exec server npm run prisma:seed
```

This creates 2 users, 15 genres, and 220 movies (deterministic — same data
every time via a fixed Faker seed) with realistic genre assignments. Re-running
`prisma:seed` is safe: the two accounts and genres are upserted (never
duplicated), movies are wiped and regenerated fresh each time.

### Seeded accounts

| Role  | Email                       | Password      |
|-------|------------------------------|---------------|
| ADMIN | `admin@movielibrary.local`  | `password123` |
| USER  | `user@movielibrary.local`   | `password123` |

## Running locally without Docker

Requires Node.js 24+ and a running Postgres instance (the easiest way to get
one is `docker compose up postgres`).

**Backend:**

```bash
cd server
cp .env.example .env   # point DATABASE_URL at your Postgres instance
npm install
npx prisma migrate deploy
npm run prisma:seed     # optional — see Seeded accounts above
npm run dev              # http://localhost:4000
```

**Frontend:**

```bash
cd client
npm install
npm run dev             # http://localhost:5173, proxies /api to :4000
```

## Tests

```bash
cd server && npm test
cd client && npm test
```

## Linting & formatting

Each app has its own ESLint config (`npm run lint`) and a shared Prettier
config (`npm run format`).
