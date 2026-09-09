# Movie Library

A full-stack movie library web app: browse, search, and filter a catalog of
movies; admins can create, edit, and delete entries. Built as a take-home
coding challenge — see [`DECISIONS.md`](./DECISIONS.md) for the architecture
rationale, trade-offs, and how AI was used during development.

## Features

- Email/password authentication (JWT in an httpOnly cookie)
- Two roles: `ADMIN` (full movie CRUD) and `USER` (browse/search only)
- Movie catalog with debounced search, genre filter, release-year filter,
  sorting, and pagination — filter state lives in the URL, so refresh/back/
  forward preserve the current view
- Movie detail view
- Admin-only create/edit forms and delete (with confirmation)
- Personal watchlist and 1–5 star ratings (any logged-in user, not just
  admins) — see [Watchlist & ratings](#watchlist--ratings)
- Interactive API docs at `/api/docs` (Swagger UI) — see [API
  documentation](#api-documentation)
- Responsive layout (desktop and mobile)
- Dark, cinematic UI theme
- 220 real movies (sourced once from TMDB, committed locally — see
  [Seeded accounts](#seeded-accounts)) across 15 genres

## Tech stack

| | |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, TanStack Query, React Router, Tailwind CSS, React Hook Form + Zod |
| **Backend** | Node.js 24, TypeScript, Express, Prisma 7, PostgreSQL |
| **Auth** | JWT in an httpOnly cookie, bcrypt password hashing |
| **Logging** | pino-http (structured JSON; pretty-printed in development) |
| **Tests** | Vitest (+ Supertest on the API, React Testing Library on the client) |
| **Infra** | Docker Compose (client / server / Postgres), nginx |

## Architecture overview

Two independent apps (`client/`, `server/`) plus Postgres, orchestrated by
Docker Compose — no monorepo tooling, no microservices. The client never
talks to the API directly by hostname: it always calls relative `/api/...`
URLs, and **nginx proxies `/api` to the server** in Docker (Vite's dev server
proxy does the same locally). This keeps client and API same-origin from the
browser's perspective in both setups, which is what makes the httpOnly auth
cookie work without any cross-origin CORS/`SameSite` complexity.

The server is a conventional layered Express app: routes validate input
(Zod) and shape responses, services own the Prisma queries and business
rules, `authenticate`/`requireRole` middleware enforce auth server-side
(never trust a client-hidden button). See `DECISIONS.md` for why each of
these choices was made and what was deliberately left out.

## Repository structure

```
movie-library-challenge/
├── docker-compose.yml
├── .env.example              # docker-compose's only .env source
├── README.md
├── DECISIONS.md
├── server/
│   ├── src/
│   │   ├── app.ts, server.ts       # Express app / entry point / Swagger mount
│   │   ├── routes/                  # auth, movies, genres, watchlist, rating — thin, validate + delegate
│   │   ├── services/                 # movieService, watchlistService, ratingService — Prisma queries, business rules
│   │   ├── middleware/                # authenticate, requireRole, validate, errorHandler, logger
│   │   ├── schemas/                    # Zod request validation (also feeds the generated OpenAPI spec)
│   │   └── lib/                         # prisma client, jwt, password hashing, auth cookie
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   ├── movies.json                # committed TMDB-sourced seed data
│   │   └── seed.ts
│   ├── scripts/
│   │   └── fetchTmdbMovies.ts         # regenerates movies.json (dev-only, needs TMDB_API_KEY)
│   └── Dockerfile
└── client/
    ├── src/
    │   ├── pages/            # LoginPage, RegisterPage, MovieLibraryPage, MovieDetailPage, WatchlistPage
    │   ├── components/         # MovieCard, MovieForm, MovieFilters, WatchlistButton, StarRatingInput, Modal, Navbar, Footer, …
    │   ├── api/                  # fetch wrappers + TanStack Query hooks
    │   └── lib/                    # apiClient (fetch wrapper + typed errors)
    ├── nginx.conf             # /api proxy + SPA fallback
    └── Dockerfile
```

## Prerequisites

- Docker Desktop (recommended path), **or** Node.js 24+ and a local
  PostgreSQL instance for running the apps without Docker
- Nothing else — no global CLI tools required

## Quick start (Docker, recommended)

```bash
git clone <this-repo-url>
cd movie-library-challenge
cp .env.example .env
docker compose up --build
```

Once the containers are up, run migrations and seed data **once** (see
[Environment variables](#environment-variables) for why this isn't
automatic):

```bash
docker compose exec server npx prisma migrate deploy
docker compose exec server npm run prisma:seed
```

Then open:

- **App:** http://localhost:3000
- **API health check:** http://localhost:3000/api/health (through nginx) or
  http://localhost:4000/api/health (direct)

## Environment variables

Docker Compose reads **only the root `.env`** (copied from `.env.example`)
— it builds `DATABASE_URL` from the Postgres credentials there and passes
everything else straight to the `server` container.

| Variable | Purpose |
|---|---|
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | Postgres credentials |
| `POSTGRES_PORT` / `SERVER_PORT` / `CLIENT_PORT` | Host ports the compose stack exposes (default 5432 / 4000 / 3000) |
| `JWT_SECRET` | Signing secret for auth tokens — change this for anything beyond local review |
| `JWT_EXPIRES_IN` | Token/cookie lifetime (e.g. `1h`) |
| `COOKIE_SECURE` | Whether the auth cookie requires HTTPS — `false` for local Docker/dev, since there's no TLS termination in front of it here |

`server/.env.example` and `client/.env.example` are for running each app
**outside** Docker (see below) and aren't read by `docker compose`.

Migrations and seeding are **deliberately not automatic** on container
start — they're explicit commands you run once, so restarts don't
accidentally re-migrate or re-seed. See `DECISIONS.md`.

## Local development (without Docker)

Requires Node.js 24+ and a reachable Postgres — the easiest way to get one
is `docker compose up postgres` and point at it.

**Backend:**

```bash
cd server
cp .env.example .env      # DATABASE_URL defaults to localhost:5432
npm install
npx prisma migrate deploy
npm run prisma:seed        # optional — see Seeded accounts below
npm run dev                 # http://localhost:4000
```

**Frontend** (separate terminal):

```bash
cd client
npm install
npm run dev                 # http://localhost:5173, proxies /api to :4000
```

## Seeded accounts

The seed script creates two accounts with the same password, so there's
only one thing to remember:

| Role | Email | Password |
|---|---|---|
| ADMIN | `admin@movielibrary.local` | `password123` |
| USER | `user@movielibrary.local` | `password123` |

It also creates 15 fixed genres and seeds 220 **real** movies (title,
overview, director, genres, rating, runtime, poster) from
`server/prisma/movies.json` — a dataset fetched once from
[TMDB](https://www.themoviedb.org/) and committed to the repo, not
generated and not fetched live. Seeding needs **no TMDB API key and no
network access to TMDB** — that's only required if you want to regenerate
the dataset itself (`npm run tmdb:fetch` in `server/`, see
`server/scripts/fetchTmdbMovies.ts`). Re-running `prisma:seed` is safe:
accounts and genres are upserted (never duplicated); movies are wiped and
regenerated from the same committed file each time (see `DECISIONS.md` for
why, and for the trade-off this dataset's "fetched once, committed forever"
shape implies against TMDB's terms).

This product uses the TMDB API but is not endorsed, certified, or
otherwise approved by TMDB (attribution notice also shown in the app's
footer).

## Tests

```bash
cd server && npm test    # Vitest + Supertest, against a real Postgres —
                           # needs `docker compose up postgres` (or the full
                           # stack) running with migrations applied
cd client && npm test    # Vitest + React Testing Library
```

## USER vs ADMIN permissions

- **Everyone** (including unauthenticated visitors) can browse, search,
  filter, sort, and view movie detail pages — reading the catalog never
  requires login.
- **ADMIN only** can create, edit, or delete movies. This is enforced
  **server-side** (`authenticate` + `requireRole('ADMIN')` middleware on
  every mutating route) — the frontend hiding the "Add Movie"/Edit/Delete
  buttons for non-admins is a UX nicety, not the actual security boundary.
- Registration (`POST /api/auth/register`) always creates a `USER` — there
  is no way, via the API or the UI, for a client to self-assign `ADMIN`.
  The only admin account is the seeded one.

## Search, filter, sort & pagination

`GET /api/movies` accepts:

```
?search=&genre=&year=&sortBy=&sortOrder=&page=&pageSize=
```

- `search` — matches **title or director**, case-insensitive
- `genre` — matches by genre **name** (e.g. `?genre=Action`), not ID — the
  same value a `<select>` populated from `GET /api/genres` submits
- `year` — exact release-year match
- `sortBy` — one of `title` (default) `releaseYear`, `rating`, `createdAt`
- `sortOrder` — `asc` (default) or `desc`
- `page` / `pageSize` — 1-indexed, `pageSize` capped at 100, default 20

Response shape:

```json
{
  "data": [ /* movies, each with a flattened genres: [{ id, name }] array */ ],
  "pagination": { "page": 1, "pageSize": 20, "total": 220, "totalPages": 11 }
}
```

On the frontend, all of this state lives in the URL's query string (not
component state), and search/year are debounced before updating it — so
typing doesn't refetch on every keystroke, but the URL (and therefore
refresh/back/forward) always reflects what's actually on screen.

## Watchlist & ratings

Any logged-in user (not just `ADMIN`) can maintain a personal watchlist and
a 1–5 star rating per movie — separate from the catalog's own `rating`
field, which only an admin edit changes.

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/api/me/watchlist` | List the current user's watchlisted movies |
| `POST` | `/api/movies/:id/watchlist` | Add a movie to the watchlist |
| `DELETE` | `/api/movies/:id/watchlist` | Remove a movie from the watchlist |
| `GET` | `/api/me/ratings` | List the current user's ratings |
| `PUT` | `/api/movies/:id/rating` | Set (or update) a 1–5 star rating |
| `DELETE` | `/api/movies/:id/rating` | Clear a rating |

All six routes require `authenticate` only (no role check) — this is the
one part of the API a plain `USER` can write to. In the UI, the bookmark
icon on each movie card and the star row on the movie detail page drive
these; `/watchlist` is the dedicated watchlist page.

## API documentation

Interactive Swagger UI, generated from the same Zod schemas the routes
validate against (`@asteasolutions/zod-to-openapi`), is served at:

- **http://localhost:3000/api/docs** (through nginx) or
  **http://localhost:4000/api/docs** (direct)
- Raw OpenAPI JSON at the same path + `/openapi.json`

## Reviewer notes

- **First-time setup needs one manual step** — after `docker compose up
  --build`, run the migrate + seed commands above once. There's nothing to
  browse (an empty catalog, no login-able accounts) until you do.
- **Poster images** are real TMDB CDN URLs (`image.tmdb.org`), stored per
  movie in the seed dataset — they need outbound internet access to load,
  but no API key (TMDB's image CDN is public; only its *data* API needs a
  key, and that's never called by the running app).
- If you rebuild only one service (e.g. `docker compose up -d --build
  server` after a backend change), the other containers keep running.
- `docker compose logs server` / `client` / `postgres` for troubleshooting;
  `docker compose ps` to check container health.
