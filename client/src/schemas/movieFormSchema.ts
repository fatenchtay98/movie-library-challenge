import { z } from 'zod';

// Mirrors the server's bounds (server/src/schemas/movieSchemas.ts) for
// immediate UX feedback — the server remains the actual source of truth.
const currentYear = new Date().getFullYear();

export const movieFormSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(300),
  description: z.string().trim().max(5000).optional().or(z.literal('')),
  releaseYear: z.coerce.number().int().min(1888).max(currentYear + 5),
  director: z.string().trim().min(1, 'Director is required').max(200),
  durationMinutes: z.coerce.number().int().min(1).max(1000),
  rating: z.coerce.number().min(0, 'Rating must be 0–10').max(10, 'Rating must be 0–10'),
  posterUrl: z.string().trim().url('Must be a valid URL').optional().or(z.literal('')),
  genreIds: z.array(z.string()).min(1, 'Select at least one genre'),
});

export type MovieFormSchema = z.infer<typeof movieFormSchema>;
