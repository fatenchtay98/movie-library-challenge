import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { renderWithProviders } from '../test-utils';
import { WatchlistButton } from './WatchlistButton';

const useAuthMock = vi.fn();
const useWatchlistMock = vi.fn();
const addMutateMock = vi.fn();
const removeMutateMock = vi.fn();

vi.mock('../api/auth', () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock('../api/watchlist', () => ({
  useWatchlist: () => useWatchlistMock(),
  useAddToWatchlist: () => ({ mutate: addMutateMock, isPending: false }),
  useRemoveFromWatchlist: () => ({ mutate: removeMutateMock, isPending: false }),
}));

describe('WatchlistButton', () => {
  it('renders nothing when not authenticated', () => {
    useAuthMock.mockReturnValue({ isAuthenticated: false });
    useWatchlistMock.mockReturnValue({ data: [] });

    renderWithProviders(<WatchlistButton movieId="movie-1" />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('shows "add" state and calls add when the movie is not saved', () => {
    useAuthMock.mockReturnValue({ isAuthenticated: true });
    useWatchlistMock.mockReturnValue({ data: [{ id: 'other-movie' }] });

    renderWithProviders(<WatchlistButton movieId="movie-1" />);

    const button = screen.getByRole('button', { name: 'Add to watchlist' });
    expect(button).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(button);
    expect(addMutateMock).toHaveBeenCalledWith('movie-1');
    expect(removeMutateMock).not.toHaveBeenCalled();
  });

  it('shows "saved" state and calls remove when the movie is already saved', () => {
    useAuthMock.mockReturnValue({ isAuthenticated: true });
    useWatchlistMock.mockReturnValue({ data: [{ id: 'movie-1' }] });

    renderWithProviders(<WatchlistButton movieId="movie-1" />);

    const button = screen.getByRole('button', { name: 'Remove from watchlist' });
    expect(button).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(button);
    expect(removeMutateMock).toHaveBeenCalledWith('movie-1');
    expect(addMutateMock).not.toHaveBeenCalled();
  });
});
