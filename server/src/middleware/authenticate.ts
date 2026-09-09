import type { NextFunction, Request, Response } from 'express';

import { AUTH_COOKIE_NAME } from '../lib/authCookie.js';
import { verifyToken } from '../lib/jwt.js';
import { prisma } from '../lib/prisma.js';
import { HttpError } from './errorHandler.js';

// Re-fetches the user from the DB on every request rather than trusting the
// JWT payload's claims directly. Costs one indexed PK lookup; in exchange, a
// deleted user's still-unexpired cookie stops working immediately, and every
// protected route (including /api/auth/me) gets consistent, current user
// data instead of duplicating lookup logic per-route.
export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const token = req.cookies?.[AUTH_COOKIE_NAME];
  if (!token) {
    next(new HttpError(401, 'Not authenticated'));
    return;
  }

  try {
    const payload = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true, createdAt: true },
    });
    if (!user) {
      next(new HttpError(401, 'Not authenticated'));
      return;
    }
    req.user = user;
    next();
  } catch {
    next(new HttpError(401, 'Not authenticated'));
  }
}
