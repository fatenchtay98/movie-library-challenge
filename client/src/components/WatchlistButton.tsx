import type { MouseEvent } from 'react';

import { useAuth } from '../api/auth';
import { useAddToWatchlist, useRemoveFromWatchlist, useWatchlist } from '../api/watchlist';

interface WatchlistButtonProps {
  movieId: string;
  className?: string;
}

export function WatchlistButton({ movieId, className = '' }: WatchlistButtonProps) {
  const { isAuthenticated } = useAuth();
  const { data: watchlist } = useWatchlist();
  const addToWatchlist = useAddToWatchlist();
  const removeFromWatchlist = useRemoveFromWatchlist();

  if (!isAuthenticated) {
    return null;
  }

  const isSaved = watchlist?.some((m) => m.id === movieId) ?? false;
  const isPending = addToWatchlist.isPending || removeFromWatchlist.isPending;

  function handleClick(e: MouseEvent) {
    // MovieCard wraps its poster in a <Link> — this button sits on top of
    // it, so it must not also trigger the navigation.
    e.preventDefault();
    e.stopPropagation();
    if (isSaved) {
      removeFromWatchlist.mutate(movieId);
    } else {
      addToWatchlist.mutate(movieId);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      aria-pressed={isSaved}
      aria-label={isSaved ? 'Remove from watchlist' : 'Add to watchlist'}
      className={`flex items-center justify-center rounded-full bg-white/90 p-1.5 shadow hover:bg-white disabled:opacity-50 ${
        isSaved ? 'text-amber-500' : 'text-slate-600'
      } ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill={isSaved ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={2}
      >
        <path d="M5 3a1 1 0 0 0-1 1v17l8-5 8 5V4a1 1 0 0 0-1-1H5z" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
