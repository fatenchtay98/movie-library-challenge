interface StarRatingInputProps {
  value: number;
  onChange: (stars: number) => void;
  onClear: () => void;
  isPending?: boolean;
}

export function StarRatingInput({ value, onChange, onClear, isPending = false }: StarRatingInputProps) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={isPending}
          onClick={() => onChange(star)}
          aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
          className="text-lg leading-none disabled:opacity-50"
        >
          <span className={star <= value ? 'text-amber-500' : 'text-slate-300'}>★</span>
        </button>
      ))}
      {value > 0 && (
        <button
          type="button"
          onClick={onClear}
          disabled={isPending}
          className="ml-1 text-xs text-slate-400 hover:text-slate-600 disabled:opacity-50"
        >
          Clear
        </button>
      )}
    </div>
  );
}
