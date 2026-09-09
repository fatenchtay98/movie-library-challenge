import { Prisma } from '../generated/prisma/client.js';
import type { Genre, Movie, MovieGenre } from '../generated/prisma/client.js';
import { HttpError } from '../middleware/errorHandler.js';
import { prisma } from '../lib/prisma.js';
import type { CreateMovieInput, MovieQuery, UpdateMovieInput } from '../schemas/movieSchemas.js';

export type MovieWithGenres = Movie & { genres: (MovieGenre & { genre: Genre })[] };

export function toPublicMovie(movie: MovieWithGenres) {
  return {
    id: movie.id,
    title: movie.title,
    description: movie.description,
    releaseYear: movie.releaseYear,
    director: movie.director,
    durationMinutes: movie.durationMinutes,
    rating: movie.rating,
    posterUrl: movie.posterUrl,
    createdAt: movie.createdAt,
    updatedAt: movie.updatedAt,
    genres: movie.genres.map((mg) => ({ id: mg.genre.id, name: mg.genre.name })),
  };
}

async function assertGenresExist(genreIds: string[]): Promise<void> {
  const count = await prisma.genre.count({ where: { id: { in: genreIds } } });
  if (count !== genreIds.length) {
    throw new HttpError(400, 'One or more genre IDs are invalid');
  }
}

export async function listMovies(query: MovieQuery) {
  const { search, genre, year, sortBy, sortOrder, page, pageSize } = query;

  const where: Prisma.MovieWhereInput = {
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: 'insensitive' as const } },
            { director: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
    ...(year !== undefined ? { releaseYear: year } : {}),
    ...(genre ? { genres: { some: { genre: { name: genre } } } } : {}),
  };

  const [total, movies] = await Promise.all([
    prisma.movie.count({ where }),
    prisma.movie.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { genres: { include: { genre: true } } },
    }),
  ]);

  return {
    data: movies.map(toPublicMovie),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / pageSize),
    },
  };
}

export async function getMovieById(id: string) {
  const movie = await prisma.movie.findUnique({
    where: { id },
    include: { genres: { include: { genre: true } } },
  });
  if (!movie) {
    throw new HttpError(404, 'Movie not found');
  }
  return toPublicMovie(movie);
}

export async function createMovie(input: CreateMovieInput) {
  const genreIds = [...new Set(input.genreIds)];
  await assertGenresExist(genreIds);

  const movie = await prisma.movie.create({
    data: {
      title: input.title,
      releaseYear: input.releaseYear,
      director: input.director,
      durationMinutes: input.durationMinutes,
      rating: input.rating,
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.posterUrl !== undefined ? { posterUrl: input.posterUrl } : {}),
      genres: { create: genreIds.map((genreId) => ({ genreId })) },
    },
    include: { genres: { include: { genre: true } } },
  });

  return toPublicMovie(movie);
}

export async function updateMovie(id: string, input: UpdateMovieInput) {
  const genreIds = input.genreIds ? [...new Set(input.genreIds)] : undefined;
  if (genreIds) {
    await assertGenresExist(genreIds);
  }

  const data: Prisma.MovieUpdateInput = {
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.description !== undefined ? { description: input.description } : {}),
    ...(input.releaseYear !== undefined ? { releaseYear: input.releaseYear } : {}),
    ...(input.director !== undefined ? { director: input.director } : {}),
    ...(input.durationMinutes !== undefined ? { durationMinutes: input.durationMinutes } : {}),
    ...(input.rating !== undefined ? { rating: input.rating } : {}),
    ...(input.posterUrl !== undefined ? { posterUrl: input.posterUrl } : {}),
  };

  try {
    const movie = await prisma.$transaction(async (tx) => {
      await tx.movie.update({ where: { id }, data });

      if (genreIds) {
        await tx.movieGenre.deleteMany({ where: { movieId: id } });
        await tx.movieGenre.createMany({
          data: genreIds.map((genreId) => ({ movieId: id, genreId })),
        });
      }

      return tx.movie.findUniqueOrThrow({
        where: { id },
        include: { genres: { include: { genre: true } } },
      });
    });

    return toPublicMovie(movie);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      throw new HttpError(404, 'Movie not found');
    }
    throw err;
  }
}

export async function deleteMovie(id: string): Promise<void> {
  try {
    await prisma.movie.delete({ where: { id } });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      throw new HttpError(404, 'Movie not found');
    }
    throw err;
  }
}
