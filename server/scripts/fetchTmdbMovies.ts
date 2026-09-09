// One-time script: TMDB API -> server/prisma/movies.json.
//
// This is a dev-time tool, not part of the app. It is never run by
// `docker compose up`, `npm run dev`, or `npm run prisma:seed` — only by a
// developer who wants to regenerate the committed dataset. Reviewers never
// need a TMDB API key to run, build, or seed the submitted app; they only
// need the already-committed prisma/movies.json.
//
// Efficiency: each movie needs its detail (runtime, full genre names,
// overview, release_date, vote_average, poster_path) AND its director
// (only available via credits, not the discover/list response) — fetched
// in ONE request per movie via `append_to_response=credits`, not two.
//
// TMDB's terms prohibit caching their data for more than 6 months without
// refreshing from the API (see DECISIONS.md) — this script's whole point is
// to make that refresh trivial: rerun it, get a fresh prisma/movies.json.

import { writeFileSync } from 'node:fs';
import path from 'node:path';

import 'dotenv/config';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
if (!TMDB_API_KEY) {
  console.error('TMDB_API_KEY is not set (see server/.env.example).');
  process.exit(1);
}

const TARGET_COUNT = 220;
const CONCURRENCY = 6;
const MAX_DISCOVER_PAGES = 30; // safety cap: 30 * 20 = 600 candidates
const OUTPUT_PATH = path.resolve(import.meta.dirname, '../prisma/movies.json');

// TMDB's genre set (19) is a superset of ours (15) — everything maps
// straight across except Science Fiction -> Sci-Fi. The four TMDB genres
// with no equivalent here (Family, History, Music, TV Movie) are simply
// dropped per-movie; a movie is only skipped if that leaves it with zero
// mapped genres, which in practice is rare for theatrical releases.
const GENRE_NAME_MAP: Record<string, string> = {
  Action: 'Action',
  Adventure: 'Adventure',
  Animation: 'Animation',
  Comedy: 'Comedy',
  Crime: 'Crime',
  Documentary: 'Documentary',
  Drama: 'Drama',
  Fantasy: 'Fantasy',
  Horror: 'Horror',
  Mystery: 'Mystery',
  Romance: 'Romance',
  'Science Fiction': 'Sci-Fi',
  Thriller: 'Thriller',
  War: 'War',
  Western: 'Western',
};

interface TmdbDiscoverResult {
  id: number;
}

interface TmdbGenre {
  id: number;
  name: string;
}

interface TmdbCrewMember {
  job: string;
  name: string;
}

interface TmdbMovieDetail {
  title: string;
  overview: string | null;
  release_date: string | null;
  runtime: number | null;
  vote_average: number | null;
  poster_path: string | null;
  genres: TmdbGenre[];
  credits: { crew: TmdbCrewMember[] };
}

export interface SeedMovie {
  title: string;
  description?: string;
  releaseYear: number;
  director: string;
  durationMinutes: number;
  rating: number;
  posterUrl?: string;
  genreNames: string[];
}

async function tmdbFetch<T>(url: string): Promise<T> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await fetch(url);
    if (res.status === 429) {
      const retryAfterSec = Number(res.headers.get('retry-after')) || 2;
      console.warn(`Rate limited, waiting ${retryAfterSec}s (attempt ${attempt}/3)...`);
      await new Promise((resolve) => setTimeout(resolve, retryAfterSec * 1000));
      continue;
    }
    if (!res.ok) {
      throw new Error(`TMDB request failed: ${res.status} ${res.statusText} (${url})`);
    }
    return res.json() as Promise<T>;
  }
  throw new Error(`TMDB request failed after retries: ${url}`);
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R | null>,
): Promise<R[]> {
  const results: R[] = [];
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const item = items[index++]!;
      const result = await fn(item);
      if (result !== null) results.push(result);
    }
  }

  await Promise.all(Array.from({ length: limit }, worker));
  return results;
}

async function fetchCandidateIds(): Promise<number[]> {
  const ids: number[] = [];
  for (let page = 1; page <= MAX_DISCOVER_PAGES; page++) {
    const data = await tmdbFetch<{ results: TmdbDiscoverResult[]; total_pages: number }>(
      `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&sort_by=popularity.desc&page=${page}&include_adult=false&vote_count.gte=100`,
    );
    ids.push(...data.results.map((r) => r.id));
    // A little more than TARGET_COUNT worth of pages, so filtering
    // (missing director/date/runtime, unmapped genres) still nets >=220.
    if (ids.length >= TARGET_COUNT * 1.4) break;
  }
  return ids;
}

function toSeedMovie(detail: TmdbMovieDetail): SeedMovie | null {
  const releaseYear = detail.release_date ? new Date(detail.release_date).getFullYear() : null;
  const director = detail.credits.crew.find((c) => c.job === 'Director')?.name;
  const durationMinutes = detail.runtime;
  const genreNames = [...new Set(detail.genres.map((g) => GENRE_NAME_MAP[g.name]).filter((n): n is string => !!n))];

  // Fallback/skip, not a schema change: a movie missing a required field
  // (or left with zero mappable genres) is dropped from the dataset rather
  // than inserted with a placeholder value.
  if (!releaseYear || !director || !durationMinutes || genreNames.length === 0) {
    return null;
  }

  return {
    title: detail.title,
    ...(detail.overview ? { description: detail.overview } : {}),
    releaseYear,
    director,
    durationMinutes,
    rating: Math.round((detail.vote_average ?? 0) * 10) / 10,
    ...(detail.poster_path ? { posterUrl: `https://image.tmdb.org/t/p/w500${detail.poster_path}` } : {}),
    genreNames,
  };
}

async function main(): Promise<void> {
  console.log('Fetching candidate movie ids from TMDB /discover...');
  const candidateIds = await fetchCandidateIds();
  console.log(`Got ${candidateIds.length} candidates. Fetching details + credits (concurrency ${CONCURRENCY})...`);

  const movies = await mapWithConcurrency(candidateIds, CONCURRENCY, async (id) => {
    const detail = await tmdbFetch<TmdbMovieDetail>(
      `https://api.themoviedb.org/3/movie/${id}?api_key=${TMDB_API_KEY}&append_to_response=credits`,
    );
    return toSeedMovie(detail);
  });

  console.log(`Kept ${movies.length} of ${candidateIds.length} candidates (skipped: missing director/date/runtime/genre).`);

  if (movies.length < TARGET_COUNT) {
    console.warn(`Warning: only netted ${movies.length}, below the ${TARGET_COUNT} target. Consider raising MAX_DISCOVER_PAGES.`);
  }

  // "Roughly 220", not "however many the overfetch margin produced" —
  // the extra candidates above are just a buffer against attrition
  // (missing director/date/genre), which in practice is often ~0% for
  // well-documented, popular movies.
  const finalMovies = movies.length > TARGET_COUNT ? movies.slice(0, TARGET_COUNT) : movies;

  const output = {
    source: 'TMDB (https://www.themoviedb.org/)',
    fetchedAt: new Date().toISOString(),
    count: finalMovies.length,
    movies: finalMovies,
  };

  writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));
  console.log(`Wrote ${finalMovies.length} movies to ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
