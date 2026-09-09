import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiFetch } from '../lib/apiClient';
import type { MovieRatingEntry } from '../types';
import { useAuth } from './auth';

export const ratingsQueryKey = ['ratings'] as const;

export function useMyRatings() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ratingsQueryKey,
    queryFn: () => apiFetch<MovieRatingEntry[]>('/me/ratings'),
    enabled: isAuthenticated,
  });
}

export function useSetRating() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ movieId, stars }: { movieId: string; stars: number }) =>
      apiFetch<MovieRatingEntry>(`/movies/${movieId}/rating`, {
        method: 'PUT',
        body: JSON.stringify({ stars }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ratingsQueryKey });
    },
  });
}

export function useDeleteRating() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (movieId: string) => apiFetch<void>(`/movies/${movieId}/rating`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ratingsQueryKey });
    },
  });
}
