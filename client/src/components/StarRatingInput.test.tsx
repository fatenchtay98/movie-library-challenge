import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { StarRatingInput } from './StarRatingInput';

describe('StarRatingInput', () => {
  it('calls onChange with the clicked star value', () => {
    const onChange = vi.fn();
    render(<StarRatingInput value={0} onChange={onChange} onClear={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Rate 4 stars' }));

    expect(onChange).toHaveBeenCalledWith(4);
  });

  it('does not show a Clear button when there is no rating', () => {
    render(<StarRatingInput value={0} onChange={vi.fn()} onClear={vi.fn()} />);
    expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument();
  });

  it('shows and wires up a Clear button once a rating is set', () => {
    const onClear = vi.fn();
    render(<StarRatingInput value={3} onChange={vi.fn()} onClear={onClear} />);

    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(onClear).toHaveBeenCalledTimes(1);
  });
});
