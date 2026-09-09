import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { app } from './app.js';

// Scaffold smoke test: proves the Express app, routing, and the centralized
// 404/error middleware are wired correctly. Doesn't touch Postgres, so it
// runs without a live DB — real endpoint tests land with those features.
describe('app', () => {
  it('returns 404 with a JSON body for an unknown route', async () => {
    const res = await request(app).get('/api/does-not-exist');

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });
});
