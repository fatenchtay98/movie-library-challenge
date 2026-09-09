import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { MovieFilters } from './MovieFilters';

function baseProps() {
  return {
    searchInput: '',
    onSearchInputChange: vi.fn(),
    genre: '',
    onGenreChange: vi.fn(),
    year: '',
    onYearChange: vi.fn(),
    sortBy: 'title' as const,
    sortOrder: 'asc' as const,
    onSortChange: vi.fn(),
    genres: [{ id: 'g1', name: 'Action' }],
  };
}

describe('MovieFilters', () => {
  it('calls onSearchInputChange as the user types', () => {
    const props = baseProps();
    render(<MovieFilters {...props} />);

    fireEvent.change(screen.getByLabelText('Search movies'), { target: { value: 'matrix' } });

    expect(props.onSearchInputChange).toHaveBeenCalledWith('matrix');
  });

  it('calls onGenreChange when a genre is selected', () => {
    const props = baseProps();
    render(<MovieFilters {...props} />);

    fireEvent.change(screen.getByLabelText('Filter by genre'), { target: { value: 'Action' } });

    expect(props.onGenreChange).toHaveBeenCalledWith('Action');
  });

  it('calls onSortChange with both sortBy and sortOrder when the sort option changes', () => {
    const props = baseProps();
    render(<MovieFilters {...props} />);

    fireEvent.change(screen.getByLabelText('Sort movies'), { target: { value: 'releaseYear-desc' } });

    expect(props.onSortChange).toHaveBeenCalledWith('releaseYear', 'desc');
  });
});
