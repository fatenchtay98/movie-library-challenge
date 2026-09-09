import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { renderWithProviders } from '../test-utils';
import { LoginPage } from './LoginPage';

const useAuthMock = vi.fn();
const useLoginMock = vi.fn();

vi.mock('../api/auth', () => ({
  useAuth: () => useAuthMock(),
  useLogin: () => useLoginMock(),
}));

describe('LoginPage', () => {
  it('renders the login form when not authenticated', () => {
    useAuthMock.mockReturnValue({ isAuthenticated: false, isLoading: false });
    useLoginMock.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });

    renderWithProviders(<LoginPage />, { route: '/login' });

    expect(screen.getByRole('heading', { name: 'Log in' })).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });

  it('redirects to the library when already authenticated', () => {
    useAuthMock.mockReturnValue({ isAuthenticated: true, isLoading: false });
    useLoginMock.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });

    renderWithProviders(
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<div>Library Page</div>} />
      </Routes>,
      { route: '/login' },
    );

    expect(screen.getByText('Library Page')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Log in' })).not.toBeInTheDocument();
  });

  it('does not redirect while the auth check is still loading', () => {
    useAuthMock.mockReturnValue({ isAuthenticated: false, isLoading: true });
    useLoginMock.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });

    renderWithProviders(<LoginPage />, { route: '/login' });

    expect(screen.getByRole('heading', { name: 'Log in' })).toBeInTheDocument();
  });
});
