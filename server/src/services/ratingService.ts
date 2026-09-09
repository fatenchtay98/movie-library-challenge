import { prisma } from '../lib/prisma.js';
import { HttpError } from '../middleware/errorHandler.js';

async function assertMovieExists(movieId: string): Promise<void> {
  const movie = await prisma.movie.findUnique({ where: { id: movieId }, select: { id: true } });
  if (!movie) {
    throw new HttpError(404, 'Movie not found');
  }
}

export async function listMyRatings(userId: string): Promise<{ movieId: string; stars: number }[]> {
  const rows = await prisma.movieRating.findMany({
    where: { userId },
    select: { movieId: true, stars: true },
  });
  return rows;
}

export async function setRating(
  userId: string,
  movieId: string,
  stars: number,
): Promise<{ movieId: string; stars: number }> {
  await assertMovieExists(movieId);
  const rating = await prisma.movieRating.upsert({
    where: { userId_movieId: { userId, movieId } },
    update: { stars },
    create: { userId, movieId, stars },
  });
  return { movieId: rating.movieId, stars: rating.stars };
}

// Idempotent delete: removing a rating that doesn't exist still succeeds.
export async function deleteRating(userId: string, movieId: string): Promise<void> {
  await prisma.movieRating.deleteMany({ where: { userId, movieId } });
}
