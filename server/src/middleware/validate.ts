import type { NextFunction, Request, Response } from 'express';
import type { ZodType } from 'zod';

import { HttpError } from './errorHandler.js';

function validate(part: 'body' | 'query' | 'params', schema: ZodType) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[part]);
    if (!result.success) {
      next(new HttpError(400, result.error.issues.map((issue) => issue.message).join(', ')));
      return;
    }
    req[part] = result.data;
    next();
  };
}

export function validateBody(schema: ZodType) {
  return validate('body', schema);
}

export function validateQuery(schema: ZodType) {
  return validate('query', schema);
}

export function validateParams(schema: ZodType) {
  return validate('params', schema);
}
