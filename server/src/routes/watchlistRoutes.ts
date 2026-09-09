import { Router } from 'express';

import { authenticate } from '../middleware/authenticate.js';
import { validateParams } from '../middleware/validate.js';
import { idParamSchema } from '../schemas/movieSchemas.js';
import { addToWatchlist, listWatchlist, removeFromWatchlist } from '../services/watchlistService.js';

// Mounted at /api (not /api/movies or /api/me) since this feature spans
// both namespaces: /me/watchlist to list, /movies/:id/watchlist to mutate.
export const watchlistRouter = Router();

watchlistRouter.get('/me/watchlist', authenticate, async (req, res, next) => {
  try {
    const movies = await listWatchlist(req.user!.id);
    res.json(movies);
  } catch (err) {
    next(err);
  }
});

watchlistRouter.post(
  '/movies/:id/watchlist',
  authenticate,
  validateParams(idParamSchema),
  async (req, res, next) => {
    try {
      await addToWatchlist(req.user!.id, req.params.id as string);
      res.status(201).end();
    } catch (err) {
      next(err);
    }
  },
);

watchlistRouter.delete(
  '/movies/:id/watchlist',
  authenticate,
  validateParams(idParamSchema),
  async (req, res, next) => {
    try {
      await removeFromWatchlist(req.user!.id, req.params.id as string);
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  },
);
