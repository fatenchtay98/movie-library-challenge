import { Router } from 'express';

import { authenticate } from '../middleware/authenticate.js';
import { validateBody, validateParams } from '../middleware/validate.js';
import { idParamSchema } from '../schemas/movieSchemas.js';
import { setRatingSchema } from '../schemas/ratingSchemas.js';
import { deleteRating, listMyRatings, setRating } from '../services/ratingService.js';

// Mounted at /api, same reasoning as watchlistRoutes: spans /me/ratings
// (list) and /movies/:id/rating (mutate). Deliberately doesn't touch
// Movie.rating (the catalog rating) — this is a separate personal value.
export const ratingRouter = Router();

ratingRouter.get('/me/ratings', authenticate, async (req, res, next) => {
  try {
    const ratings = await listMyRatings(req.user!.id);
    res.json(ratings);
  } catch (err) {
    next(err);
  }
});

ratingRouter.put(
  '/movies/:id/rating',
  authenticate,
  validateParams(idParamSchema),
  validateBody(setRatingSchema),
  async (req, res, next) => {
    try {
      const { stars } = req.body as { stars: number };
      const rating = await setRating(req.user!.id, req.params.id as string, stars);
      res.json(rating);
    } catch (err) {
      next(err);
    }
  },
);

ratingRouter.delete(
  '/movies/:id/rating',
  authenticate,
  validateParams(idParamSchema),
  async (req, res, next) => {
    try {
      await deleteRating(req.user!.id, req.params.id as string);
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  },
);
