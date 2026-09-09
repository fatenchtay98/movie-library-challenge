import { z } from 'zod';

import { registry } from './registry.js';

// Documentation-only response shapes — kept separate from the request-
// validation schemas in src/schemas/, which stay untouched by this feature.
// Registering the *existing* request schemas directly (see paths.ts) is
// what keeps those two from drifting apart; these just describe what comes
// back, which nothing elsewhere in the app models as a Zod schema today.

export const errorResponseSchema = registry.register(
  'ErrorResponse',
  z.object({ error: z.string() }).openapi({ example: { error: 'Not authenticated' } }),
);

export const genreResponseSchema = registry.register(
  'Genre',
  z.object({
    id: z.string().uuid(),
    name: z.string(),
  }),
);

export const publicUserResponseSchema = registry.register(
  'User',
  z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    role: z.enum(['ADMIN', 'USER']),
    createdAt: z.string().datetime(),
  }),
);

export const movieResponseSchema = registry.register(
  'Movie',
  z.object({
    id: z.string().uuid(),
    title: z.string(),
    description: z.string().nullable(),
    releaseYear: z.number().int(),
    director: z.string(),
    durationMinutes: z.number().int(),
    rating: z.number(),
    posterUrl: z.string().nullable(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    genres: z.array(genreResponseSchema),
  }),
);

export const paginationResponseSchema = registry.register(
  'Pagination',
  z.object({
    page: z.number().int(),
    pageSize: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
  }),
);

export const movieListResponseSchema = registry.register(
  'MovieListResponse',
  z.object({
    data: z.array(movieResponseSchema),
    pagination: paginationResponseSchema,
  }),
);

export const ratingEntryResponseSchema = registry.register(
  'RatingEntry',
  z.object({
    movieId: z.string().uuid(),
    stars: z.number().int().min(1).max(5),
  }),
);
