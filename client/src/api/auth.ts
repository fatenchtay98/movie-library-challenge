import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiFetch } from '../lib/apiClient';
import type { PublicUser } from '../types';

export const meQueryKey = ['me'] as const;

async function getMe(): Promise<PublicUser | null> {
  const res = await fetch('/api/auth/me', { credentials: 'include' });
  if (res.status === 401) {
    return null;
  }
  if (!res.ok) {
    throw new Error('Failed to load current user');
  }
  return res.json();
}

export function useAuth() {
  const { data: user, isLoading } = useQuery({ queryKey: meQueryKey, queryFn: getMe });
  return {
    user: user ?? null,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'ADMIN',
  };
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { email: string; password: string }) =>
      apiFetch<PublicUser>('/auth/login', { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: (user) => {
      queryClient.setQueryData(meQueryKey, user);
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { email: string; password: string }) =>
      apiFetch<PublicUser>('/auth/register', { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: (user) => {
      queryClient.setQueryData(meQueryKey, user);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch<void>('/auth/logout', { method: 'POST' }),
    onSuccess: () => {
      queryClient.setQueryData(meQueryKey, null);
    },
  });
}
