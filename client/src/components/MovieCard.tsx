import { Link } from 'react-router-dom';

import type { Movie } from '../types';
import { WatchlistButton } from './WatchlistButton';

interface MovieCardProps {
  movie: Movie;
  isAdmin: boolean;
  onEdit: (movie: Movie) => void;
  onDelete: (movie: Movie) => void;
}

export function MovieCard({ movie, isAdmin, onEdit, onDelete }: MovieCardProps) {
  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <Link to={`/movies/${movie.id}`} className="relative block aspect-[2/3] bg-slate-100">
        {movie.posterUrl ? (
          <img
            src={movie.posterUrl}
            alt={`${movie.title} poster`}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-slate-400">
            No poster
          </div>
        )}
        <WatchlistButton movieId={movie.id} className="absolute right-2 top-2" />
      </Link>

      <div className="flex flex-1 flex-col gap-1 p-3">
        <Link to={`/movies/${movie.id}`} className="line-clamp-1 font-semibold text-slate-900 hover:underline">
          {movie.title}
        </Link>
        <p className="line-clamp-1 text-sm text-slate-500">
          {movie.director} · {movie.releaseYear}
        </p>
        <p className="text-sm font-medium text-amber-600">★ {movie.rating.toFixed(1)}</p>

        <div className="mt-1 flex flex-wrap gap-1">
          {movie.genres.map((genre) => (
            <span
              key={genre.id}
              className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
            >
              {genre.name}
            </span>
          ))}
        </div>

        {isAdmin && (
          <div className="mt-auto flex gap-2 pt-3">
            <button
              type="button"
              onClick={() => onEdit(movie)}
              className="flex-1 rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => onDelete(movie)}
              className="flex-1 rounded-md border border-red-200 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
