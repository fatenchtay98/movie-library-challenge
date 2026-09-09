import { z } from 'zod';

import { loginSchema, registerSchema } from '../schemas/authSchemas.js';
import {
  createMovieSchema,
  idParamSchema,
  movieQuerySchema,
  updateMovieSchema,
} from '../schemas/movieSchemas.js';
import { setRatingSchema } from '../schemas/ratingSchemas.js';
import { registry } from './registry.js';
import {
  errorResponseSchema,
  genreResponseSchema,
  movieListResponseSchema,
  movieResponseSchema,
  publicUserResponseSchema,
  ratingEntryResponseSchema,
} from './responseSchemas.js';

const json = <T extends z.ZodTypeAny>(schema: T) => ({
  content: { 'application/json': { schema } },
});

const noContent = { description: 'No content' };

// --- Health -----------------------------------------------------------

registry.registerPath({
  method: 'get',
  path: '/api/health',
  tags: ['Health'],
  summary: 'Liveness + DB connectivity check',
  responses: {
    200: { description: 'OK', ...json(z.object({ status: z.literal('ok'), db: z.literal('connected') })) },
  },
});

// --- Auth ---------------------------------------------------------------

registry.registerPath({
  method: 'post',
  path: '/api/auth/register',
  tags: ['Auth'],
  summary: 'Register a new account (always created as USER)',
  request: { body: json(registerSchema) },
  responses: {
    201: { description: 'Registered and logged in', ...json(publicUserResponseSchema) },
    400: { description: 'Validation error', ...json(errorResponseSchema) },
    409: { description: 'Email already registered', ...json(errorResponseSchema) },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/auth/login',
  tags: ['Auth'],
  summary: 'Log in',
  request: { body: json(loginSchema) },
  responses: {
    200: { description: 'Logged in', ...json(publicUserResponseSchema) },
    400: { description: 'Validation error', ...json(errorResponseSchema) },
    401: { description: 'Invalid email or password', ...json(errorResponseSchema) },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/auth/logout',
  tags: ['Auth'],
  summary: 'Log out (clears the auth cookie)',
  responses: { 204: noContent },
});

registry.registerPath({
  method: 'get',
  path: '/api/auth/me',
  tags: ['Auth'],
  summary: 'Current authenticated user',
  security: [{ cookieAuth: [] }],
  responses: {
    200: { description: 'Current user', ...json(publicUserResponseSchema) },
    401: { description: 'Not authenticated', ...json(errorResponseSchema) },
  },
});

// --- Movies ---------------------------------------------------------------

registry.registerPath({
  method: 'get',
  path: '/api/movies',
  tags: ['Movies'],
  summary: 'List movies — search, filter, sort, paginate (public)',
  request: { query: movieQuerySchema },
  responses: {
    200: { description: 'Paginated movie list', ...json(movieListResponseSchema) },
    400: { description: 'Validation error', ...json(errorResponseSchema) },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/movies/{id}',
  tags: ['Movies'],
  summary: 'Get a movie by id (public)',
  request: { params: idParamSchema },
  responses: {
    200: { description: 'Movie', ...json(movieResponseSchema) },
    400: { description: 'Invalid id', ...json(errorResponseSchema) },
    404: { description: 'Movie not found', ...json(errorResponseSchema) },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/movies',
  tags: ['Movies'],
  summary: 'Create a movie (ADMIN only)',
  security: [{ cookieAuth: [] }],
  request: { body: json(createMovieSchema) },
  responses: {
    201: { description: 'Created movie', ...json(movieResponseSchema) },
    400: { description: 'Validation error', ...json(errorResponseSchema) },
    401: { description: 'Not authenticated', ...json(errorResponseSchema) },
    403: { description: 'Not an ADMIN', ...json(errorResponseSchema) },
  },
});

registry.registerPath({
  method: 'patch',
  path: '/api/movies/{id}',
  tags: ['Movies'],
  summary: 'Update a movie (ADMIN only, partial)',
  security: [{ cookieAuth: [] }],
  request: { params: idParamSchema, body: json(updateMovieSchema) },
  responses: {
    200: { description: 'Updated movie', ...json(movieResponseSchema) },
    400: { description: 'Validation error', ...json(errorResponseSchema) },
    401: { description: 'Not authenticated', ...json(errorResponseSchema) },
    403: { description: 'Not an ADMIN', ...json(errorResponseSchema) },
    404: { description: 'Movie not found', ...json(errorResponseSchema) },
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/movies/{id}',
  tags: ['Movies'],
  summary: 'Delete a movie (ADMIN only)',
  security: [{ cookieAuth: [] }],
  request: { params: idParamSchema },
  responses: {
    204: noContent,
    401: { description: 'Not authenticated', ...json(errorResponseSchema) },
    403: { description: 'Not an ADMIN', ...json(errorResponseSchema) },
    404: { description: 'Movie not found', ...json(errorResponseSchema) },
  },
});

// --- Genres -----------------------------------------------------------

registry.registerPath({
  method: 'get',
  path: '/api/genres',
  tags: ['Genres'],
  summary: 'List all genres (public)',
  responses: {
    200: { description: 'Genres', ...json(z.array(genreResponseSchema)) },
  },
});

// --- Watchlist ----------------------------------------------------------

registry.registerPath({
  method: 'get',
  path: '/api/me/watchlist',
  tags: ['Watchlist'],
  summary: "List the current user's saved movies",
  security: [{ cookieAuth: [] }],
  responses: {
    200: { description: 'Saved movies', ...json(z.array(movieResponseSchema)) },
    401: { description: 'Not authenticated', ...json(errorResponseSchema) },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/movies/{id}/watchlist',
  tags: ['Watchlist'],
  summary: 'Save a movie to the watchlist (idempotent)',
  security: [{ cookieAuth: [] }],
  request: { params: idParamSchema },
  responses: {
    201: noContent,
    401: { description: 'Not authenticated', ...json(errorResponseSchema) },
    404: { description: 'Movie not found', ...json(errorResponseSchema) },
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/movies/{id}/watchlist',
  tags: ['Watchlist'],
  summary: 'Remove a movie from the watchlist (idempotent)',
  security: [{ cookieAuth: [] }],
  request: { params: idParamSchema },
  responses: {
    204: noContent,
    401: { description: 'Not authenticated', ...json(errorResponseSchema) },
  },
});

// --- Ratings --------------------------------------------------------------

registry.registerPath({
  method: 'get',
  path: '/api/me/ratings',
  tags: ['Ratings'],
  summary: "List the current user's personal movie ratings",
  security: [{ cookieAuth: [] }],
  responses: {
    200: { description: 'Ratings', ...json(z.array(ratingEntryResponseSchema)) },
    401: { description: 'Not authenticated', ...json(errorResponseSchema) },
  },
});

registry.registerPath({
  method: 'put',
  path: '/api/movies/{id}/rating',
  tags: ['Ratings'],
  summary: "Set (or update) the current user's rating for a movie — separate from the catalog Movie.rating",
  security: [{ cookieAuth: [] }],
  request: { params: idParamSchema, body: json(setRatingSchema) },
  responses: {
    200: { description: 'Rating', ...json(ratingEntryResponseSchema) },
    400: { description: 'Validation error', ...json(errorResponseSchema) },
    401: { description: 'Not authenticated', ...json(errorResponseSchema) },
    404: { description: 'Movie not found', ...json(errorResponseSchema) },
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/movies/{id}/rating',
  tags: ['Ratings'],
  summary: "Remove the current user's rating for a movie (idempotent)",
  security: [{ cookieAuth: [] }],
  request: { params: idParamSchema },
  responses: {
    204: noContent,
    401: { description: 'Not authenticated', ...json(errorResponseSchema) },
  },
});
