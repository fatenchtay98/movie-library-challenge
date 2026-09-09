import { z } from 'zod';

const currentYear = new Date().getFullYear();

export const idParamSchema = z.object({
  id: z.string().uuid(),
});

export const movieQuerySchema = z.object({
  search: z.string().trim().min(1).optional(),
  genre: z.string().trim().min(1).optional(),
  year: z.coerce.number().int().optional(),
  sortBy: z.enum(['title', 'releaseYear', 'rating', 'createdAt']).default('title'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type MovieQuery = z.infer<typeof movieQuerySchema>;

const movieBaseFields = {
  title: z.string().trim().min(1).max(300),
  description: z.string().trim().max(5000).optional(),
  releaseYear: z.number().int().min(1888).max(currentYear + 5),
  director: z.string().trim().min(1).max(200),
  durationMinutes: z.number().int().min(1).max(1000),
  rating: z.number().min(0).max(10),
  posterUrl: z.string().trim().url().optional(),
  // At least one genre — consistent with the seed-data constraint that every
  // movie has a genre; the API shouldn't produce data the seed wouldn't.
  genreIds: z.array(z.string().uuid()).min(1),
};

export const createMovieSchema = z.object(movieBaseFields);
export type CreateMovieInput = z.infer<typeof createMovieSchema>;

export const updateMovieSchema = z.object(movieBaseFields).partial();
export type UpdateMovieInput = z.infer<typeof updateMovieSchema>;
