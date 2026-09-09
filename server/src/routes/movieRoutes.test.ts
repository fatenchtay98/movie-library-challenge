import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '../app.js';
import { prisma } from '../lib/prisma.js';

// Integration tests against the real (dev/docker-compose) Postgres, same
// approach as authRoutes.test.ts — requires the seeded genres to exist
// (`npm run prisma:seed`), since genre filtering/creation needs real genre
// rows to reference.

const runId = Date.now();
const emailsCreated: string[] = [];
const createdMovieIds: string[] = [];

function uniqueEmail(label: string): string {
  const email = `${label}-${runId}@example.com`;
  emailsCreated.push(email);
  return email;
}

let genreIds: string[];
let genreNames: string[];
let adminAgent: ReturnType<typeof request.agent>;
let userAgent: ReturnType<typeof request.agent>;

beforeAll(async () => {
  const genres = await prisma.genre.findMany({ orderBy: { name: 'asc' }, take: 3 });
  if (genres.length < 3) {
    throw new Error('Movie API tests need at least 3 seeded genres — run `npm run prisma:seed` first.');
  }
  genreIds = genres.map((g) => g.id);
  genreNames = genres.map((g) => g.name);

  adminAgent = request.agent(app);
  const adminEmail = uniqueEmail('movie-admin');
  await adminAgent.post('/api/auth/register').send({ email: adminEmail, password: 'password123' });
  // No re-login needed: `authenticate` re-fetches the user from the DB on
  // every request, so the existing cookie picks up the new role immediately.
  await prisma.user.update({ where: { email: adminEmail }, data: { role: 'ADMIN' } });

  userAgent = request.agent(app);
  const userEmail = uniqueEmail('movie-user');
  await userAgent.post('/api/auth/register').send({ email: userEmail, password: 'password123' });
});

afterAll(async () => {
  await prisma.movie.deleteMany({ where: { id: { in: createdMovieIds } } });
  await prisma.user.deleteMany({ where: { email: { in: emailsCreated } } });
});

function moviePayload(overrides: Record<string, unknown> = {}) {
  return {
    title: `Test Movie ${runId}`,
    description: 'A test movie.',
    releaseYear: 2020,
    director: 'Test Director',
    durationMinutes: 120,
    rating: 7.5,
    posterUrl: 'https://picsum.photos/seed/test/400/600',
    genreIds: [genreIds[0]],
    ...overrides,
  };
}

describe('GET /api/genres', () => {
  it('returns the seeded genres without auth', async () => {
    const res = await request(app).get('/api/genres');
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(15);
  });
});

describe('Movie CRUD', () => {
  it('ADMIN can create a movie with genres', async () => {
    const res = await adminAgent.post('/api/movies').send(moviePayload());

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ title: `Test Movie ${runId}`, rating: 7.5 });
    expect(res.body.genres).toHaveLength(1);
    expect(res.body.genres[0].id).toBe(genreIds[0]);
    createdMovieIds.push(res.body.id);
  });

  it('GET /:id returns the created movie', async () => {
    const created = await adminAgent.post('/api/movies').send(moviePayload({ title: `Get Me ${runId}` }));
    createdMovieIds.push(created.body.id);

    const res = await request(app).get(`/api/movies/${created.body.id}`);
    expect(res.status).toBe(200);
    expect(res.body.title).toBe(`Get Me ${runId}`);
  });

  it('ADMIN can update a movie, including replacing its genres', async () => {
    const created = await adminAgent.post('/api/movies').send(moviePayload({ title: `Update Me ${runId}` }));
    createdMovieIds.push(created.body.id);

    const res = await adminAgent
      .patch(`/api/movies/${created.body.id}`)
      .send({ title: `Updated ${runId}`, genreIds: [genreIds[1], genreIds[2]] });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe(`Updated ${runId}`);
    expect(res.body.genres.map((g: { id: string }) => g.id).sort()).toEqual(
      [genreIds[1], genreIds[2]].sort(),
    );
  });

  it('ADMIN can delete a movie, and it 404s afterward', async () => {
    const created = await adminAgent.post('/api/movies').send(moviePayload({ title: `Delete Me ${runId}` }));

    const del = await adminAgent.delete(`/api/movies/${created.body.id}`);
    expect(del.status).toBe(204);

    const get = await request(app).get(`/api/movies/${created.body.id}`);
    expect(get.status).toBe(404);
  });
});

describe('Movie API authorization', () => {
  it('GET /api/movies works without authentication', async () => {
    const res = await request(app).get('/api/movies');
    expect(res.status).toBe(200);
  });

  it('POST without auth returns 401', async () => {
    const res = await request(app).post('/api/movies').send(moviePayload());
    expect(res.status).toBe(401);
  });

  it('POST as a non-admin USER returns 403', async () => {
    const res = await userAgent.post('/api/movies').send(moviePayload());
    expect(res.status).toBe(403);
  });

  it('PATCH as a non-admin USER returns 403', async () => {
    const created = await adminAgent.post('/api/movies').send(moviePayload({ title: `Authz ${runId}` }));
    createdMovieIds.push(created.body.id);

    const res = await userAgent.patch(`/api/movies/${created.body.id}`).send({ title: 'Hacked' });
    expect(res.status).toBe(403);
  });

  it('DELETE as a non-admin USER returns 403', async () => {
    const created = await adminAgent.post('/api/movies').send(moviePayload({ title: `Authz2 ${runId}` }));
    createdMovieIds.push(created.body.id);

    const res = await userAgent.delete(`/api/movies/${created.body.id}`);
    expect(res.status).toBe(403);
  });
});

describe('Validation and not-found cases', () => {
  it('POST with an out-of-range rating returns 400', async () => {
    const res = await adminAgent.post('/api/movies').send(moviePayload({ rating: 15 }));
    expect(res.status).toBe(400);
  });

  it('POST with an empty genreIds array returns 400', async () => {
    const res = await adminAgent.post('/api/movies').send(moviePayload({ genreIds: [] }));
    expect(res.status).toBe(400);
  });

  it('POST with a nonexistent genre ID returns 400', async () => {
    const res = await adminAgent
      .post('/api/movies')
      .send(moviePayload({ genreIds: ['00000000-0000-0000-0000-000000000000'] }));
    expect(res.status).toBe(400);
  });

  it('GET /:id with a non-UUID id returns 400', async () => {
    const res = await request(app).get('/api/movies/not-a-uuid');
    expect(res.status).toBe(400);
  });

  it('GET /:id for a well-formed but nonexistent id returns 404', async () => {
    const res = await request(app).get('/api/movies/00000000-0000-0000-0000-000000000000');
    expect(res.status).toBe(404);
  });

  it('PATCH a nonexistent movie returns 404', async () => {
    const res = await adminAgent
      .patch('/api/movies/00000000-0000-0000-0000-000000000000')
      .send({ title: 'Nope' });
    expect(res.status).toBe(404);
  });

  it('DELETE a nonexistent movie returns 404', async () => {
    const res = await adminAgent.delete('/api/movies/00000000-0000-0000-0000-000000000000');
    expect(res.status).toBe(404);
  });
});

describe('Search, filtering, sorting, pagination', () => {
  const distinctiveTitle = `Zzyzx-${runId}`;
  const distinctiveDirector = `Zzyzx-Director-${runId}`;
  const distinctiveYear = 1901;

  beforeAll(async () => {
    const searchTarget = await adminAgent.post('/api/movies').send(
      moviePayload({ title: distinctiveTitle, director: distinctiveDirector, releaseYear: distinctiveYear }),
    );
    createdMovieIds.push(searchTarget.body.id);

    const genreTarget = await adminAgent.post('/api/movies').send(
      moviePayload({ title: `Genre Filter Target ${runId}`, genreIds: [genreIds[0]] }),
    );
    createdMovieIds.push(genreTarget.body.id);
  });

  it('search matches by title', async () => {
    const res = await request(app).get('/api/movies').query({ search: distinctiveTitle });
    expect(res.status).toBe(200);
    expect(res.body.data.some((m: { title: string }) => m.title === distinctiveTitle)).toBe(true);
  });

  it('search matches by director', async () => {
    const res = await request(app).get('/api/movies').query({ search: distinctiveDirector });
    expect(res.status).toBe(200);
    expect(res.body.data.some((m: { title: string }) => m.title === distinctiveTitle)).toBe(true);
  });

  it('filters by release year', async () => {
    const res = await request(app).get('/api/movies').query({ year: distinctiveYear });
    expect(res.status).toBe(200);
    expect(res.body.data.every((m: { releaseYear: number }) => m.releaseYear === distinctiveYear)).toBe(
      true,
    );
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('filters by genre name', async () => {
    const res = await request(app).get('/api/movies').query({ genre: genreNames[0] });
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    for (const movie of res.body.data) {
      expect(movie.genres.some((g: { name: string }) => g.name === genreNames[0])).toBe(true);
    }
  });

  it('sorts by releaseYear ascending', async () => {
    const res = await request(app)
      .get('/api/movies')
      .query({ sortBy: 'releaseYear', sortOrder: 'asc', pageSize: 10 });
    expect(res.status).toBe(200);
    const years = res.body.data.map((m: { releaseYear: number }) => m.releaseYear);
    expect(years).toEqual([...years].sort((a, b) => a - b));
  });

  it('paginates with correct pagination metadata', async () => {
    const res = await request(app).get('/api/movies').query({ page: 2, pageSize: 5 });
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(5);
    expect(res.body.pagination).toMatchObject({ page: 2, pageSize: 5 });
    expect(res.body.pagination.total).toBeGreaterThanOrEqual(220);
    expect(res.body.pagination.totalPages).toBe(Math.ceil(res.body.pagination.total / 5));
  });
});
