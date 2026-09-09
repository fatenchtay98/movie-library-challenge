# Decisions

## Architecture & trade-offs

**Two independent apps, no monorepo tooling, no microservices.** `client/`
and `server/` are plain, separate npm projects orchestrated only by Docker
Compose. For a one-day, two-app project, Nx/Turborepo would be pure
overhead, and splitting the API into services would add network hops and
deployment complexity with no corresponding benefit at this scale. In
production at real scale, the API is the one piece I'd reconsider — as
"movies" and "auth" grow, splitting them behind a gateway becomes
reasonable; today they share one Postgres and one process for a reason.

**Express + TypeScript**, not a heavier framework (NestJS, etc.). Express
plus a thin layering convention (routes → services, Zod at the boundary,
centralized error/auth middleware) gets the same separation of concerns
without a DI container or decorator-heavy ceremony this scope doesn't need.

**PostgreSQL + Prisma.** Relational data (movies, genres, a real
many-to-many, users) with real invariants (uniqueness, foreign keys) is
exactly what Postgres is for. Prisma gives migrations, a typed client, and
a fast path from schema to working code. Landed on Prisma **7** specifically
before any domain code existed — see AI usage below for how that decision
actually got made mid-project.

**`MovieGenre` as an explicit model, not implicit many-to-many.** Costs one
extra model and a manual join-table write (delete-then-recreate in a
transaction on update, since Prisma's `set: [...]` shorthand only exists for
implicit m2m) in exchange for a real, inspectable table, an explicit
composite primary key expressing "no duplicate pairing" for free, and room
to add columns later if the domain ever needed them.

**UUIDs as the id strategy**, not autoincrementing integers. Chosen for
consistency across all models and to keep `User` ids non-enumerable — a
minor but real hygiene point once auth exists. Deliberately **not** treated
as a security boundary in itself; authorization is still checked
server-side on every request regardless of whether an id is guessable.
Trade-off accepted: 16 bytes vs. 4, and worse write-locality at real
production write volume — irrelevant at this project's scale.

**JWT in an httpOnly cookie**, never `localStorage`. `httpOnly` closes the
XSS token-theft vector; `SameSite=Lax` (see the nginx point below) covers
CSRF for this architecture without a separate CSRF-token system. `secure`
is keyed off a dedicated `COOKIE_SECURE` env var, not `NODE_ENV` — Docker
Compose sets `NODE_ENV=production` for this deployment even though there's
no real TLS in front of it, so tying `secure` to `NODE_ENV` would have
silently broken the cookie over plain HTTP.

**USER/ADMIN authorization enforced server-side**, via `authenticate` +
`requireRole('ADMIN')` middleware on every mutating movie route. The
frontend hides admin controls for non-admins, but that's UX only — the
actual boundary is server-side and is explicitly tested (a `USER` hitting a
mutating route gets a real 403, not just a hidden button).

**Watchlist and personal ratings are `authenticate`-only, no role check** —
the one part of the API a plain `USER` can write to, by design: these are
per-user preferences, not catalog data, so gating them behind `ADMIN` would
make the feature pointless. Deliberately modeled as separate
`Watchlist`/`MovieRating` tables (each user+movie pair, at most one row)
rather than reusing or overloading `Movie.rating` — a user's personal
1–5-star rating and the catalog's own aggregate `rating` field are
different concepts that happen to share a name, and conflating them would
mean one admin's edit could clobber another user's personal score.

**nginx proxies `/api` to the server; the client only ever calls relative
`/api/...` URLs** (Vite's dev proxy mirrors this locally). This makes
client and API same-origin from the browser's perspective in both Docker
and local dev, which is what makes the httpOnly cookie flow work without
any cross-origin `SameSite`/CORS-with-credentials complexity — a
consequence explored in more detail in the AI usage section, since this was
a mid-project architecture change, not the original plan.

**TanStack Query owns frontend server state**, no Redux/separate client
store. Auth state is just the `['me']` query's cache — login/register
mutations write directly into it via `setQueryData` (the response already
has the full user shape, so no extra round-trip), logout clears it. One
less abstraction layer than a parallel Context + reducer would need.

**Search/filter/sort/pagination computed server-side**, not fetch-everything-
and-filter-client-side. At 220 seed rows this wouldn't matter for
performance, but doing it server-side is the only version that's actually
correct once pagination exists (client-side filtering after paginating
would filter within a page, not across the whole dataset).

**Offset pagination (`page`/`pageSize`), not cursor-based.** Offset
pagination's known weaknesses — page drift under concurrent inserts/deletes,
`O(n)` cost for `OFFSET` at very large `n` — don't apply here: this is a
browsing UI over a slowly-changing catalog (not a real-time feed), and the
dataset is in the hundreds of rows, not millions. Cursor pagination would be
the right call at real scale or for infinite-scroll UX (explicitly out of
scope here); it's not worth the added API complexity for `page=1&pageSize=20`
against 220 rows.

**Seed data is 220 real movies from TMDB, fetched once and committed**
(`server/prisma/movies.json`), not generated (originally Faker) and not
fetched live at seed/run time. `server/scripts/fetchTmdbMovies.ts` is a
one-time, standalone dev tool — reviewers need no TMDB API key and no
network call to TMDB to seed or run the app; only re-running that script to
regenerate the dataset needs one. Fetches each movie's detail *with
credits appended* (`append_to_response=credits`) rather than two separate
requests, since director isn't on the list/discover response. TMDB's own
~19 genres map onto our existing 15 (only `Science Fiction` → `Sci-Fi`
needed a name change; `Family`/`History`/`Music`/`TV Movie` have no
equivalent and are simply dropped per-movie) — the existing Genre seed list
was deliberately left untouched rather than replaced, to keep this a
contained data-source swap. A movie missing a required field (director,
release date, runtime) or left with zero mappable genres after translation
is skipped, not inserted with a placeholder — fallback/skip, not a schema
change. Accounts and genres are **upserted** (stable ids, never duplicated
across reruns); movies have no natural unique key to upsert against
(duplicate titles are legitimate), so reruns **delete and regenerate**
movies from the same committed file. Movie *ids* are therefore not
reproducible across reseeds, only the human-visible content is — ids were
never meant to be stable identifiers (see the UUID point above).

**TMDB attribution and a real terms-of-use trade-off.** TMDB's terms
require displaying their logo (sized less prominently than the app's own
branding) plus a specific notice — both are in the app's footer, and the
logo is a locally-bundled static asset (not hotlinked to TMDB's servers,
which would reintroduce exactly the runtime dependency this whole
architecture avoids). Their terms also prohibit caching TMDB data for more
than 6 months without refreshing from the API — this project's "fetch
once, commit forever" dataset is technically exactly what that clause
targets. For a one-time take-home submission reviewed within days, the
practical risk is negligible; a real production deployment kept in
long-term use would need `fetchTmdbMovies.ts` run periodically (e.g. a
scheduled job), not a static committed file. Documented here rather than
quietly ignored.

**This destructive reseed is only safe today** because it runs *before* any
movie-mutation feature existed to create data worth preserving. Now that
movie CRUD is live, rerunning the seed would also wipe any manually
created/edited movies — a real, documented sharp edge, not an oversight. A
production version would need seed data to either target a clearly-marked
subset or move to a one-time migration instead of a rerunnable script.

**Tests run against the real development Postgres**, not an isolated
test database or `testcontainers`-style ephemeral instance. Each test uses
timestamp-suffixed unique data and cleans up via `afterAll`, so the suite
is re-runnable without manual resets — but it's still sharing a database
with whatever else is using the dev environment, and requires Postgres to
already be up and migrated before `npm test` works. The honest trade-off
for a one-day scope: a real isolated test database (or transactional
rollback per test) is the correct production setup and was skipped here for
time.

**API docs generated from the same Zod schemas that validate requests**
(`@asteasolutions/zod-to-openapi` + `swagger-ui-express`), not hand-written
or hand-maintained YAML. The spec can't drift from what the routes actually
accept, at the cost of one registration call per schema. Pinned to v7.3.4
specifically because v8/v9 require zod v4 and this project is on zod v3 —
upgrading zod itself just to get a docs library felt like the wrong
trade-off for an optional/suggested feature.

**Dark, fixed-palette UI theme, no light/dark toggle.** A single
zinc-950/900/800 palette with one emerald accent reads as a deliberate,
finished design rather than default browser styling, for less effort than
building and testing two themes. A real product would very likely want a
toggle; skipped here as suggested-feature polish, not a required one.

**Deliberately deferred, production-auth features:** refresh tokens (a
single `JWT_EXPIRES_IN`-lived token with no rotation — expiry alone forces
re-login), rate limiting on login/register (no brute-force protection at
all right now), password reset, email verification, real session
revocation (logout only clears the browser's cookie; a captured token
remains valid until it naturally expires — no server-side blocklist), and
additional CSRF-token infrastructure (currently unnecessary because
`SameSite=Lax` plus the same-origin nginx proxy already covers this
architecture's actual CSRF exposure — it becomes necessary again if client
and API are ever deployed cross-origin).

**Deliberately not built at all, as unnecessary for this scope:**
microservices, Redis, message queues, real image upload/storage (poster
URLs are external links), infinite scroll, a design system or animation
library, GraphQL. None of these solve a problem this project actually has.

## AI usage

Claude Code (Anthropic's CLI agent) was used throughout — architecture
planning, scaffolding, implementation, tests, debugging, and this
documentation. The process was iterative and reviewed at every phase, not
"describe the app once and accept whatever came out." Some concrete
examples of where AI output was reviewed, pushed back on, corrected, or
rewritten:

- **Node version.** Claude's first scaffold used Node 20. When asked to
  reconsider given Node 20's actual EOL status, Claude checked current
  LTS support (Node 20 fully EOL, Node 22 in Maintenance LTS, Node 24 the
  current Active LTS) and the choice moved to Node 24 — a real
  fact-check-and-revise, not a guess.
- **Prisma version.** The scaffold initially used Prisma 5. Before any
  domain code (models, migrations) existed, this was revisited and moved
  to Prisma 7 — the point in the project where a major-version change costs
  the least. Claude flagged the concrete consequences up front (mandatory
  ESM, a driver-adapter pattern replacing direct-URL connections, a
  generated-client output path that doesn't exist under `node_modules`)
  before writing any of it.
- **Prisma Client before any schema models existed.** An early attempt to
  keep a placeholder `src/lib/prisma.ts` around (from the original,
  simpler Prisma setup) broke once Prisma 7 was in place — `prisma
  generate` hard-errors on a model-less schema, and there was nothing to
  import. The fix was to remove the placeholder entirely rather than paper
  over it with a fake/dummy model just to make the generator run — an
  explicit call not to introduce speculative schema just to satisfy
  tooling.
- **Docker/Prisma generation configuration.** Once the real schema existed,
  restoring `prisma generate` in the Docker build stage surfaced a real
  build failure: `prisma.config.ts`'s `env('DATABASE_URL')` has to resolve
  just to *load the config*, even though `generate` itself never connects
  to a database. Fixed with a placeholder build-time `DATABASE_URL` scoped
  only to that stage — diagnosed from an actual failed build, not
  anticipated in advance.
- **Logging library.** Morgan was the original scaffold choice (simplicity
  first). Given the "production quality" bar, this was revisited and
  replaced with `pino-http` for structured JSON logs in production
  (pretty-printed only in development) — sharing one logger instance
  between request logging and the centralized error handler.
- **Frontend/API communication.** The original plan baked an API base URL
  into the client build via a Docker `ARG`. This was reconsidered in favor
  of an nginx `/api` reverse proxy (mirrored by Vite's dev proxy locally),
  specifically to make the httpOnly cookie same-origin and sidestep
  cross-origin `SameSite`/CORS complexity before auth was implemented —
  and it simplified the client, removing the build-arg machinery entirely.
- **A real testing bug, found by writing tests, not anticipated.** Frontend
  tests started failing with "found multiple elements" once a test file
  had more than one test. Root cause: `vitest.config.mts` uses
  `globals: false` (deliberate, to match the server's explicit-import
  style), which means React Testing Library's automatic
  `afterEach(cleanup)` never registers — it detects the test framework via
  globals on `globalThis`. Diagnosed from the actual failure and fixed once
  in `setupTests.ts`, which matters for every future test file, not just
  the ones that surfaced it.
- **Dependency vulnerabilities were investigated, not rubber-stamped.**
  When `npm audit` flagged issues, each was evaluated on its own merits
  rather than blanket-accepted or blanket-ignored: a critical `bcrypt`
  transitive (`tar`) vulnerability and a moderate `express`/`qs` one were
  fixed (both are real runtime dependencies); a set of Prisma-CLI-bundled
  `mysql2`/`deepmerge-ts` findings were left as a documented, accepted gap
  because npm's own suggested fix was a downgrade to Prisma 6, which
  contradicts the deliberate decision to be on 7, and the affected code
  path (a MySQL driver bundled for a database this project doesn't use)
  never executes.
- **Suggestions were tested, not trusted.** Design proposals (the Prisma
  schema, the auth design, the Movie API shape) were presented for review
  before implementation at every phase, and specific choices were
  overridden on request — e.g. `MovieGenre`'s genre-side foreign key uses
  `Restrict` rather than Claude's original `Cascade` suggestion, on the
  reasoning that silently stripping classification data from movies is
  worse than a blocked delete for what's effectively static reference data.
  Every phase's implementation was independently verified (typecheck,
  lint, build, real test runs against a live Postgres, and manual
  click-through of both ADMIN and USER flows through the actual
  Docker/nginx stack — not just trusting that code which "looked right"
  worked) before moving on.

- **A recommendation the developer overrode, on record.** Asked to evaluate
  replacing the Faker seed with real TMDB data, Claude's recommendation was
  to skip it — real vs. synthetic movie titles don't affect code quality,
  architecture, or test coverage, and it adds a new external-integration
  surface (rate limits, a licensing/attribution obligation) for a cosmetic
  payoff. The developer weighed that and decided to proceed anyway; Claude
  implemented it as specified rather than re-litigating the decision, and
  flagged two concrete, previously-unmentioned findings once actually
  implementing it (TMDB's logo requirement, not just text; the 6-month
  caching clause) rather than silently proceeding around them.

The throughline: AI materially accelerated how fast a working, tested,
Dockerized full-stack app came together — but every non-trivial decision in
this document was made, reviewed, and in several cases reversed by the
developer, not accepted as given.
