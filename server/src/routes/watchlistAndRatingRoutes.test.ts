import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '../app.js';
import { prisma } from '../lib/prisma.js';

// Same integration-test approach as the other route test files: real
// Postgres, unique per-run data, cleanup in afterAll.

const runId = Date.now();
const emailsCreated: string[] = [];

function uniqueEmail(label: string): string {
  const email = `${label}-${runId}@example.com`;
  emailsCreated.push(email);
  return email;
}

let movieAId: string;
let movieBId: string;
let userAgent: ReturnType<typeof request.agent>;
let otherUserAgent: ReturnType<typeof request.agent>;

beforeAll(async () => {
  const genre = await prisma.genre.findFirst();
  if (!genre) {
    throw new Error('Watchlist/rating tests need at least one seeded genre — run `npm run prisma:seed` first.');
  }

  userAgent = request.agent(app);
  await userAgent.post('/api/auth/register').send({ email: uniqueEmail('wl-user'), password: 'password123' });

  otherUserAgent = request.agent(app);
  await otherUserAgent
    .post('/api/auth/register')
    .send({ email: uniqueEmail('wl-other-user'), password: 'password123' });

  // Created directly via Prisma, not the API — these test users aren't
  // ADMIN, and only the ids are needed for the watchlist/rating fixtures.
  const movieA = await prisma.movie.create({
    data: {
      title: `Watchlist Test Movie A ${runId}`,
      releaseYear: 2020,
      director: 'Dir A',
      durationMinutes: 100,
      rating: 7,
      genres: { create: [{ genreId: genre.id }] },
    },
  });
  const movieB = await prisma.movie.create({
    data: {
      title: `Watchlist Test Movie B ${runId}`,
      releaseYear: 2021,
      director: 'Dir B',
      durationMinutes: 100,
      rating: 7,
      genres: { create: [{ genreId: genre.id }] },
    },
  });
  movieAId = movieA.id;
  movieBId = movieB.id;
});

afterAll(async () => {
  await prisma.movie.deleteMany({ where: { id: { in: [movieAId, movieBId] } } });
  await prisma.user.deleteMany({ where: { email: { in: emailsCreated } } });
});

describe('Watchlist', () => {
  it('requires authentication', async () => {
    expect((await request(app).get('/api/me/watchlist')).status).toBe(401);
    expect((await request(app).post(`/api/movies/${movieAId}/watchlist`)).status).toBe(401);
    expect((await request(app).delete(`/api/movies/${movieAId}/watchlist`)).status).toBe(401);
  });

  it('adds a movie, lists it, and adding again is idempotent', async () => {
    const add1 = await userAgent.post(`/api/movies/${movieAId}/watchlist`);
    expect(add1.status).toBe(201);

    const add2 = await userAgent.post(`/api/movies/${movieAId}/watchlist`);
    expect(add2.status).toBe(201);

    const list = await userAgent.get('/api/me/watchlist');
    expect(list.status).toBe(200);
    expect(list.body).toHaveLength(1);
    expect(list.body[0].id).toBe(movieAId);
  });

  it('removes a movie, and removing again is idempotent', async () => {
    await userAgent.post(`/api/movies/${movieAId}/watchlist`);

    const del1 = await userAgent.delete(`/api/movies/${movieAId}/watchlist`);
    expect(del1.status).toBe(204);

    const del2 = await userAgent.delete(`/api/movies/${movieAId}/watchlist`);
    expect(del2.status).toBe(204);

    const list = await userAgent.get('/api/me/watchlist');
    expect(list.body).toHaveLength(0);
  });

  it('returns 404 for a nonexistent movie', async () => {
    const res = await userAgent.post('/api/movies/00000000-0000-0000-0000-000000000000/watchlist');
    expect(res.status).toBe(404);
  });

  it('scopes the watchlist to the authenticated user', async () => {
    await userAgent.post(`/api/movies/${movieAId}/watchlist`);
    await otherUserAgent.post(`/api/movies/${movieBId}/watchlist`);

    const userList = await userAgent.get('/api/me/watchlist');
    const otherList = await otherUserAgent.get('/api/me/watchlist');

    expect(userList.body.map((m: { id: string }) => m.id)).toEqual([movieAId]);
    expect(otherList.body.map((m: { id: string }) => m.id)).toEqual([movieBId]);

    // cleanup for this test's fixtures
    await userAgent.delete(`/api/movies/${movieAId}/watchlist`);
    await otherUserAgent.delete(`/api/movies/${movieBId}/watchlist`);
  });
});

describe('Movie rating', () => {
  it('requires authentication', async () => {
    expect((await request(app).get('/api/me/ratings')).status).toBe(401);
    expect((await request(app).put(`/api/movies/${movieAId}/rating`).send({ stars: 4 })).status).toBe(401);
    expect((await request(app).delete(`/api/movies/${movieAId}/rating`)).status).toBe(401);
  });

  it('sets a rating, lists it, and updates it in place (no duplicate)', async () => {
    const set1 = await userAgent.put(`/api/movies/${movieAId}/rating`).send({ stars: 3 });
    expect(set1.status).toBe(200);
    expect(set1.body).toMatchObject({ movieId: movieAId, stars: 3 });

    const set2 = await userAgent.put(`/api/movies/${movieAId}/rating`).send({ stars: 5 });
    expect(set2.status).toBe(200);
    expect(set2.body).toMatchObject({ movieId: movieAId, stars: 5 });

    const list = await userAgent.get('/api/me/ratings');
    expect(list.body).toEqual([{ movieId: movieAId, stars: 5 }]);
  });

  it('rejects a rating outside 1-5', async () => {
    expect((await userAgent.put(`/api/movies/${movieAId}/rating`).send({ stars: 0 })).status).toBe(400);
    expect((await userAgent.put(`/api/movies/${movieAId}/rating`).send({ stars: 6 })).status).toBe(400);
  });

  it('removes a rating, and removing again is idempotent', async () => {
    await userAgent.put(`/api/movies/${movieAId}/rating`).send({ stars: 4 });

    const del1 = await userAgent.delete(`/api/movies/${movieAId}/rating`);
    expect(del1.status).toBe(204);

    const del2 = await userAgent.delete(`/api/movies/${movieAId}/rating`);
    expect(del2.status).toBe(204);

    const list = await userAgent.get('/api/me/ratings');
    expect(list.body).toEqual([]);
  });

  it('never touches the catalog Movie.rating field', async () => {
    await userAgent.put(`/api/movies/${movieAId}/rating`).send({ stars: 1 });

    const movie = await request(app).get(`/api/movies/${movieAId}`);
    expect(movie.body.rating).toBe(7);

    await userAgent.delete(`/api/movies/${movieAId}/rating`);
  });
});
