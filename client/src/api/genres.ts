import { useQuery } from '@tanstack/react-query';

import { apiFetch } from '../lib/apiClient';
import type { Genre } from '../types';

export function useGenres() {
  return useQuery({
    queryKey: ['genres'],
    queryFn: () => apiFetch<Genre[]>('/genres'),
    staleTime: 5 * 60 * 1000, // static reference data, no need to refetch often
  });
}
