import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiFetch } from '../lib/apiClient';
import type { Movie, MovieFormValues, MovieListParams, MovieListResponse } from '../types';

function buildQueryString(params: MovieListParams): string {
  const qs = new URLSearchParams();
  if (params.search) qs.set('search', params.search);
  if (params.genre) qs.set('genre', params.genre);
  if (params.year !== undefined) qs.set('year', String(params.year));
  if (params.sortBy) qs.set('sortBy', params.sortBy);
  if (params.sortOrder) qs.set('sortOrder', params.sortOrder);
  if (params.page !== undefined) qs.set('page', String(params.page));
  if (params.pageSize !== undefined) qs.set('pageSize', String(params.pageSize));
  return qs.toString();
}

export function useMovies(params: MovieListParams) {
  return useQuery({
    queryKey: ['movies', params],
    queryFn: () => apiFetch<MovieListResponse>(`/movies?${buildQueryString(params)}`),
    placeholderData: keepPreviousData,
  });
}

export function useMovie(id: string | undefined) {
  return useQuery({
    queryKey: ['movie', id],
    queryFn: () => apiFetch<Movie>(`/movies/${id}`),
    enabled: !!id,
  });
}

export function useCreateMovie() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MovieFormValues) =>
      apiFetch<Movie>('/movies', { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movies'] });
    },
  });
}

export function useUpdateMovie() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<MovieFormValues> }) =>
      apiFetch<Movie>(`/movies/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['movies'] });
      queryClient.invalidateQueries({ queryKey: ['movie', variables.id] });
    },
  });
}

export function useDeleteMovie() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<void>(`/movies/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movies'] });
    },
  });
}
