import { Navigate } from 'react-router-dom';

import { useAuth } from '../api/auth';
import { useWatchlist } from '../api/watchlist';
import { MovieCard } from '../components/MovieCard';
import { MovieCardSkeleton } from '../components/MovieCardSkeleton';

// No search/filter/pagination here, unlike MovieLibraryPage — a personal
// watchlist tops out at 220 movies (the whole catalog), so rendering it
// flat is simpler and fine at this scale.
export function WatchlistPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: movies, isLoading, isError } = useWatchlist();

  if (!authLoading && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="mb-6 text-2xl font-semibold text-zinc-100">My Watchlist</h1>

      {isLoading && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 5 }, (_, i) => (
            <MovieCardSkeleton key={i} />
          ))}
        </div>
      )}

      {isError && (
        <p className="py-12 text-center text-red-400">Something went wrong loading your watchlist.</p>
      )}

      {!isLoading && !isError && movies?.length === 0 && (
        <p className="py-12 text-center text-zinc-500">
          Your watchlist is empty — save a movie from its card or detail page to see it here.
        </p>
      )}

      {!isLoading && !isError && movies && movies.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {movies.map((movie) => (
            // Deliberately not admin-editable from here — this is a
            // personal saved-movies view, not a management surface; use
            // the library grid or the movie's own detail page to edit.
            <MovieCard key={movie.id} movie={movie} isAdmin={false} onEdit={() => {}} onDelete={() => {}} />
          ))}
        </div>
      )}
    </main>
  );
}
