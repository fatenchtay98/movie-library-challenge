import type { NextFunction, Request, Response } from 'express';

import type { Role } from '../generated/prisma/client.js';
import { HttpError } from './errorHandler.js';

// Always compose after `authenticate`: router.post(path, authenticate, requireRole('ADMIN'), handler)
export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new HttpError(401, 'Not authenticated'));
      return;
    }
    if (!roles.includes(req.user.role)) {
      next(new HttpError(403, 'Forbidden'));
      return;
    }
    next();
  };
}
