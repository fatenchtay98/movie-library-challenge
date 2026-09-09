import { Router } from 'express';

import { prisma } from '../lib/prisma.js';

export const genreRouter = Router();

genreRouter.get('/', async (_req, res, next) => {
  try {
    const genres = await prisma.genre.findMany({ orderBy: { name: 'asc' } });
    res.json(genres);
  } catch (err) {
    next(err);
  }
});
