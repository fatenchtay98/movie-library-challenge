import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { MovieForm } from './MovieForm';

vi.mock('../api/genres', () => ({
  useGenres: () => ({ data: [{ id: 'g1', name: 'Action' }] }),
}));

describe('MovieForm', () => {
  it('shows a validation error and does not submit when required fields are empty', async () => {
    const onSubmit = vi.fn();
    render(<MovieForm isSubmitting={false} submitLabel="Create" onSubmit={onSubmit} onCancel={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(screen.getByText('Title is required')).toBeInTheDocument();
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows a validation error for an out-of-range rating', async () => {
    const onSubmit = vi.fn();
    render(<MovieForm isSubmitting={false} submitLabel="Create" onSubmit={onSubmit} onCancel={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Valid Title' } });
    fireEvent.change(screen.getByLabelText('Director'), { target: { value: 'Valid Director' } });
    fireEvent.change(screen.getByLabelText('Rating (0–10)'), { target: { value: '15' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(screen.getByText('Rating must be 0–10')).toBeInTheDocument();
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits valid values', async () => {
    const onSubmit = vi.fn();
    render(<MovieForm isSubmitting={false} submitLabel="Create" onSubmit={onSubmit} onCancel={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Valid Title' } });
    fireEvent.change(screen.getByLabelText('Director'), { target: { value: 'Valid Director' } });
    fireEvent.click(screen.getByLabelText('Action'));
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
    expect(onSubmit.mock.calls[0][0]).toMatchObject({ title: 'Valid Title', director: 'Valid Director' });
  });
});
