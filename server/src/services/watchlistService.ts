import { prisma } from '../lib/prisma.js';
import { HttpError } from '../middleware/errorHandler.js';
import { toPublicMovie } from './movieService.js';

async function assertMovieExists(movieId: string): Promise<void> {
  const movie = await prisma.movie.findUnique({ where: { id: movieId }, select: { id: true } });
  if (!movie) {
    throw new HttpError(404, 'Movie not found');
  }
}

export async function listWatchlist(userId: string) {
  const rows = await prisma.watchlist.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: { movie: { include: { genres: { include: { genre: true } } } } },
  });
  return rows.map((row) => toPublicMovie(row.movie));
}

// Upsert, not create: adding an already-saved movie is a no-op success, not
// an error — the frontend shouldn't have to track "is it already saved"
// before calling this.
export async function addToWatchlist(userId: string, movieId: string): Promise<void> {
  await assertMovieExists(movieId);
  await prisma.watchlist.upsert({
    where: { userId_movieId: { userId, movieId } },
    update: {},
    create: { userId, movieId },
  });
}

// Idempotent delete: removing something that was never saved still succeeds.
export async function removeFromWatchlist(userId: string, movieId: string): Promise<void> {
  await prisma.watchlist.deleteMany({ where: { userId, movieId } });
}
