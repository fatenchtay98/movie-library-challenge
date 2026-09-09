import { useState } from 'react';

interface StarRatingInputProps {
  value: number;
  onChange: (stars: number) => void;
  onClear: () => void;
  isPending?: boolean;
}

export function StarRatingInput({ value, onChange, onClear, isPending = false }: StarRatingInputProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const displayValue = hovered ?? value;

  return (
    <div className="flex items-center gap-1" onMouseLeave={() => setHovered(null)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={isPending}
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
          className="text-lg leading-none transition-transform hover:scale-110 disabled:opacity-50"
        >
          <span className={star <= displayValue ? 'text-amber-400' : 'text-zinc-600'}>★</span>
        </button>
      ))}
      {value > 0 && (
        <button
          type="button"
          onClick={onClear}
          disabled={isPending}
          className="ml-1 text-xs text-zinc-500 transition-colors hover:text-zinc-300 disabled:opacity-50"
        >
          Clear
        </button>
      )}
    </div>
  );
}
