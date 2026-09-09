import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { renderWithProviders } from '../test-utils';
import type { Movie } from '../types';
import { MovieCard } from './MovieCard';

const movie: Movie = {
  id: '1',
  title: 'Test Movie',
  description: null,
  releaseYear: 2020,
  director: 'Test Director',
  durationMinutes: 100,
  rating: 7.5,
  posterUrl: null,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  genres: [{ id: 'g1', name: 'Action' }],
};

describe('MovieCard', () => {
  it('hides edit/delete controls for a non-admin', () => {
    renderWithProviders(<MovieCard movie={movie} isAdmin={false} onEdit={vi.fn()} onDelete={vi.fn()} />);

    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
  });

  it('shows edit/delete controls for an admin', () => {
    renderWithProviders(<MovieCard movie={movie} isAdmin={true} onEdit={vi.fn()} onDelete={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
  });

  it('always shows core movie details regardless of role', () => {
    renderWithProviders(<MovieCard movie={movie} isAdmin={false} onEdit={vi.fn()} onDelete={vi.fn()} />);

    expect(screen.getByText('Test Movie')).toBeInTheDocument();
    expect(screen.getByText(/Test Director/)).toBeInTheDocument();
    expect(screen.getByText('Action')).toBeInTheDocument();
  });
});
