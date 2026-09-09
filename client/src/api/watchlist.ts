import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiFetch } from '../lib/apiClient';
import type { Movie } from '../types';
import { useAuth } from './auth';

export const watchlistQueryKey = ['watchlist'] as const;

export function useWatchlist() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: watchlistQueryKey,
    queryFn: () => apiFetch<Movie[]>('/me/watchlist'),
    enabled: isAuthenticated,
  });
}

export function useAddToWatchlist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (movieId: string) => apiFetch<void>(`/movies/${movieId}/watchlist`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: watchlistQueryKey });
    },
  });
}

export function useRemoveFromWatchlist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (movieId: string) => apiFetch<void>(`/movies/${movieId}/watchlist`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: watchlistQueryKey });
    },
  });
}
