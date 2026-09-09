import type { NextFunction, Request, Response } from 'express';

import { logger } from './logger.js';

export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({ error: `Not found: ${req.method} ${req.originalUrl}` });
}

// Express identifies error-handling middleware by arity (4 params) — the
// unused `next` must stay in the signature even though it's never called.
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const status = err instanceof HttpError ? err.status : 500;
  const message = err instanceof Error ? err.message : 'Internal server error';

  if (status >= 500) {
    logger.error(err);
  }

  res.status(status).json({ error: message });
}
