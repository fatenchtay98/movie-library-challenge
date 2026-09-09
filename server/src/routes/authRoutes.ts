import { Router } from 'express';

import { Prisma, Role } from '../generated/prisma/client.js';
import type { User } from '../generated/prisma/client.js';
import { setAuthCookie, clearAuthCookie } from '../lib/authCookie.js';
import { signToken } from '../lib/jwt.js';
import { hashPassword, verifyDummyPassword, verifyPassword } from '../lib/password.js';
import { prisma } from '../lib/prisma.js';
import { authenticate } from '../middleware/authenticate.js';
import { HttpError } from '../middleware/errorHandler.js';
import { validateBody } from '../middleware/validate.js';
import { loginSchema, registerSchema } from '../schemas/authSchemas.js';

export const authRouter = Router();

function toPublicUser(user: Pick<User, 'id' | 'email' | 'role' | 'createdAt'>) {
  return { id: user.id, email: user.email, role: user.role, createdAt: user.createdAt };
}

authRouter.post('/register', validateBody(registerSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body as { email: string; password: string };
    const passwordHash = await hashPassword(password);

    // `role` is never read from the request body — Zod's schema doesn't even
    // have that field, and it's hardcoded here regardless, so there's no
    // path (typo, extra field, client bug) that can smuggle a role through.
    const user = await prisma.user.create({
      data: { email, passwordHash, role: Role.USER },
    });

    const { token, maxAgeMs } = signToken({ sub: user.id, email: user.email, role: user.role });
    setAuthCookie(res, token, maxAgeMs);

    res.status(201).json(toPublicUser(user));
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      next(new HttpError(409, 'Email already registered'));
      return;
    }
    next(err);
  }
});

authRouter.post('/login', validateBody(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body as { email: string; password: string };
    const user = await prisma.user.findUnique({ where: { email } });

    // Same 401 message either way, and bcrypt.compare runs regardless of
    // whether the user exists — an early return here would let response
    // timing reveal whether the email is registered.
    if (!user) {
      await verifyDummyPassword(password);
      next(new HttpError(401, 'Invalid email or password'));
      return;
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      next(new HttpError(401, 'Invalid email or password'));
      return;
    }

    const { token, maxAgeMs } = signToken({ sub: user.id, email: user.email, role: user.role });
    setAuthCookie(res, token, maxAgeMs);

    res.json(toPublicUser(user));
  } catch (err) {
    next(err);
  }
});

authRouter.post('/logout', (_req, res) => {
  clearAuthCookie(res);
  res.status(204).end();
});

authRouter.get('/me', authenticate, (req, res) => {
  res.json(req.user);
});
