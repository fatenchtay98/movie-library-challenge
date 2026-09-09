import 'dotenv/config';

import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { hashPassword } from '../src/lib/password.js';
import { prisma } from '../src/lib/prisma.js';
import { Role } from '../src/generated/prisma/client.js';

// Real movies, sourced once from TMDB via scripts/fetchTmdbMovies.ts and
// committed here — not generated at seed time, and not fetched from TMDB at
// seed/run time either. Re-running this script is fully offline and
// deterministic: the same prisma/movies.json every time, no network call,
// no TMDB API key required. See DECISIONS.md for the 6-month-cache trade-off
// this implies (TMDB's terms want data refreshed periodically; a one-time
// take-home submission doesn't need that, a long-lived deployment would).
const MOVIES_DATASET_PATH = path.resolve(import.meta.dirname, 'movies.json');

const GENRE_NAMES = [
  'Action',
  'Adventure',
  'Animation',
  'Comedy',
  'Crime',
  'Documentary',
  'Drama',
  'Fantasy',
  'Horror',
  'Mystery',
  'Romance',
  'Sci-Fi',
  'Thriller',
  'War',
  'Western',
] as const;

const SEED_ACCOUNTS = [
  { email: 'admin@movielibrary.local', password: 'password123', role: Role.ADMIN },
  { email: 'user@movielibrary.local', password: 'password123', role: Role.USER },
] as const;

interface SeedMovie {
  title: string;
  description?: string;
  releaseYear: number;
  director: string;
  durationMinutes: number;
  rating: number;
  posterUrl?: string;
  genreNames: string[];
}

function loadMoviesDataset(): SeedMovie[] {
  const raw = readFileSync(MOVIES_DATASET_PATH, 'utf-8');
  const parsed = JSON.parse(raw) as { movies: SeedMovie[] };
  return parsed.movies;
}

async function seedAccounts(): Promise<void> {
  for (const account of SEED_ACCOUNTS) {
    const email = account.email.toLowerCase();
    const passwordHash = await hashPassword(account.password);

    await prisma.user.upsert({
      where: { email },
      update: {},
      create: { email, passwordHash, role: account.role },
    });
  }
}

async function seedGenres(): Promise<Record<string, string>> {
  const genreIdByName: Record<string, string> = {};

  for (const name of GENRE_NAMES) {
    const genre = await prisma.genre.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    genreIdByName[name] = genre.id;
  }

  return genreIdByName;
}

async function seedMovies(genreIdByName: Record<string, string>): Promise<void> {
  // No unique constraint on Movie to upsert against (duplicate titles are
  // legitimate — see the schema phase), so reruns wipe and regenerate.
  // Movie CRUD doesn't exist yet, so nothing else could have created movies
  // by this point — safe today. Once the CRUD API lands, rerunning this
  // would also wipe any manually-created movies; worth revisiting then.
  await prisma.movie.deleteMany({});

  const dataset = loadMoviesDataset();

  const movies = dataset.map((movie) => ({
    id: randomUUID(),
    title: movie.title,
    description: movie.description ?? null,
    releaseYear: movie.releaseYear,
    director: movie.director,
    durationMinutes: movie.durationMinutes,
    rating: movie.rating,
    posterUrl: movie.posterUrl ?? null,
    genreNames: movie.genreNames,
  }));

  await prisma.movie.createMany({
    data: movies.map(({ genreNames: _genreNames, ...movie }) => movie),
  });

  const movieGenreRows = movies.flatMap((movie) =>
    movie.genreNames
      .map((name) => genreIdByName[name])
      .filter((genreId): genreId is string => !!genreId)
      .map((genreId) => ({ movieId: movie.id, genreId })),
  );

  await prisma.movieGenre.createMany({ data: movieGenreRows });
}

async function main(): Promise<void> {
  await seedAccounts();
  const genreIdByName = await seedGenres();
  await seedMovies(genreIdByName);

  const [userCount, genreCount, movieCount] = await Promise.all([
    prisma.user.count(),
    prisma.genre.count(),
    prisma.movie.count(),
  ]);

  console.log(`Seeded: ${userCount} users, ${genreCount} genres, ${movieCount} movies.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
