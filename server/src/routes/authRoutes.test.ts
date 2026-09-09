import request from 'supertest';
import { afterAll, describe, expect, it, vi } from 'vitest';

import { app } from '../app.js';
import { requireRole } from '../middleware/requireRole.js';
import { prisma } from '../lib/prisma.js';

// These are integration tests against the real (dev/docker-compose) Postgres
// — no test-DB/transaction-rollback infra for a one-day scope, so each test
// uses a unique email to stay re-runnable, and afterAll cleans up what it
// created. Requires `docker compose up postgres` (or the full stack) running
// locally with a migrated database.

const runId = Date.now();
const emailsCreated: string[] = [];

function uniqueEmail(label: string): string {
  const email = `${label}-${runId}@example.com`;
  emailsCreated.push(email);
  return email;
}

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { in: emailsCreated } } });
});

describe('POST /api/auth/register', () => {
  it('creates a user, sets the auth cookie, and returns the public shape', async () => {
    const email = uniqueEmail('register-success');

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email, password: 'password123' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ email, role: 'USER' });
    expect(res.body).not.toHaveProperty('passwordHash');
    expect(res.headers['set-cookie']?.[0]).toMatch(/^token=.*HttpOnly/i);
  });

  it('ignores a client-supplied role and always creates USER', async () => {
    const email = uniqueEmail('register-role-ignored');

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email, password: 'password123', role: 'ADMIN' });

    expect(res.status).toBe(201);
    expect(res.body.role).toBe('USER');
  });

  it('rejects a duplicate email with 409', async () => {
    const email = uniqueEmail('register-duplicate');
    await request(app).post('/api/auth/register').send({ email, password: 'password123' });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email, password: 'password123' });

    expect(res.status).toBe(409);
    expect(res.body).toHaveProperty('error');
  });

  it('rejects an invalid body with 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'not-an-email', password: 'short' });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  it('logs in with correct credentials and sets the auth cookie', async () => {
    const email = uniqueEmail('login-success');
    await request(app).post('/api/auth/register').send({ email, password: 'password123' });

    const res = await request(app).post('/api/auth/login').send({ email, password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ email, role: 'USER' });
    expect(res.headers['set-cookie']?.[0]).toMatch(/^token=.*HttpOnly/i);
  });

  it('returns 401 with a generic message for a wrong password', async () => {
    const email = uniqueEmail('login-wrong-password');
    await request(app).post('/api/auth/register').send({ email, password: 'password123' });

    const res = await request(app).post('/api/auth/login').send({ email, password: 'wrong-password' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid email or password');
  });

  it('returns the identical 401 message for a nonexistent email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody-here@example.com', password: 'whatever123' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid email or password');
  });
});

describe('POST /api/auth/logout', () => {
  it('clears the auth cookie', async () => {
    const res = await request(app).post('/api/auth/logout');

    expect(res.status).toBe(204);
    expect(res.headers['set-cookie']?.[0]).toMatch(/^token=;/);
  });
});

describe('GET /api/auth/me', () => {
  it('returns 401 without a cookie', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns the current user when logged in', async () => {
    const email = uniqueEmail('me-success');
    const agent = request.agent(app);
    await agent.post('/api/auth/register').send({ email, password: 'password123' });

    const res = await agent.get('/api/auth/me');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ email, role: 'USER' });
  });

  it('returns 401 for a tampered cookie', async () => {
    const res = await request(app).get('/api/auth/me').set('Cookie', 'token=not-a-real-jwt');
    expect(res.status).toBe(401);
  });
});

describe('requireRole middleware', () => {
  function callWithRole(role: 'ADMIN' | 'USER' | undefined) {
    const next = vi.fn();
    const req = {
      user: role ? { id: '1', email: 'x@example.com', role, createdAt: new Date() } : undefined,
    } as never;
    requireRole('ADMIN')(req, {} as never, next);
    return next;
  }

  it('calls next() with no error when the role matches', () => {
    const next = callWithRole('ADMIN');
    expect(next).toHaveBeenCalledWith();
  });

  it('calls next(403) when authenticated but wrong role', () => {
    const next = callWithRole('USER');
    expect(next.mock.calls[0]?.[0]).toMatchObject({ status: 403 });
  });

  it('calls next(401) when not authenticated', () => {
    const next = callWithRole(undefined);
    expect(next.mock.calls[0]?.[0]).toMatchObject({ status: 401 });
  });
});
