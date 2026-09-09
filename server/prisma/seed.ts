import 'dotenv/config';

import { randomUUID } from 'node:crypto';

import { faker } from '@faker-js/faker';

import { hashPassword } from '../src/lib/password.js';
import { prisma } from '../src/lib/prisma.js';
import { Role } from '../src/generated/prisma/client.js';

// Fixed seed -> the same 220 movies (titles, years, genre assignments, etc.)
// every run, so setup is predictable for review. Movie *ids* are still fresh
// UUIDs each run (see below) - only the human-visible content is
// deterministic, which is what actually matters for a repeatable demo.
const FAKER_SEED = 42;
const MOVIE_COUNT = 220;

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

function randomTitle(): string {
  const words = faker.word.words({ count: { min: 2, max: 5 } }).split(' ');
  return words.map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
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

  const genreNames = Object.keys(genreIdByName);
  const currentYear = new Date().getFullYear();

  const movies = Array.from({ length: MOVIE_COUNT }, () => ({
    id: randomUUID(),
    title: randomTitle(),
    description: faker.lorem.paragraph(),
    releaseYear: faker.number.int({ min: 1960, max: currentYear }),
    director: faker.person.fullName(),
    durationMinutes: faker.number.int({ min: 75, max: 210 }),
    rating: faker.number.float({ min: 0, max: 10, fractionDigits: 1 }),
    posterUrl: `https://picsum.photos/seed/movie-${randomUUID()}/400/600`,
  }));

  await prisma.movie.createMany({ data: movies });

  const movieGenreRows = movies.flatMap((movie) => {
    const genreCount = faker.number.int({ min: 1, max: 3 });
    const genresForMovie = faker.helpers.arrayElements(genreNames, genreCount);
    return genresForMovie.map((name) => ({
      movieId: movie.id,
      genreId: genreIdByName[name]!,
    }));
  });

  await prisma.movieGenre.createMany({ data: movieGenreRows });
}

async function main(): Promise<void> {
  faker.seed(FAKER_SEED);

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
