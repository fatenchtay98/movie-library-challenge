import { Router } from 'express';

import { authenticate } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/requireRole.js';
import { validateBody, validateParams, validateQuery } from '../middleware/validate.js';
import { Role } from '../generated/prisma/client.js';
import {
  createMovieSchema,
  idParamSchema,
  movieQuerySchema,
  updateMovieSchema,
} from '../schemas/movieSchemas.js';
import {
  createMovie,
  deleteMovie,
  getMovieById,
  listMovies,
  updateMovie,
} from '../services/movieService.js';

export const movieRouter = Router();

movieRouter.get('/', validateQuery(movieQuerySchema), async (req, res, next) => {
  try {
    const result = await listMovies(req.query as never);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

movieRouter.get('/:id', validateParams(idParamSchema), async (req, res, next) => {
  try {
    const movie = await getMovieById(req.params.id as string);
    res.json(movie);
  } catch (err) {
    next(err);
  }
});

movieRouter.post(
  '/',
  authenticate,
  requireRole(Role.ADMIN),
  validateBody(createMovieSchema),
  async (req, res, next) => {
    try {
      const movie = await createMovie(req.body as never);
      res.status(201).json(movie);
    } catch (err) {
      next(err);
    }
  },
);

movieRouter.patch(
  '/:id',
  authenticate,
  requireRole(Role.ADMIN),
  validateParams(idParamSchema),
  validateBody(updateMovieSchema),
  async (req, res, next) => {
    try {
      const movie = await updateMovie(req.params.id as string, req.body as never);
      res.json(movie);
    } catch (err) {
      next(err);
    }
  },
);

movieRouter.delete(
  '/:id',
  authenticate,
  requireRole(Role.ADMIN),
  validateParams(idParamSchema),
  async (req, res, next) => {
    try {
      await deleteMovie(req.params.id as string);
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  },
);
