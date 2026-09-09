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
    <div className="group flex flex-col overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 shadow-md transition-all duration-200 hover:-translate-y-1 hover:border-zinc-700 hover:shadow-xl hover:shadow-black/40">
      <Link to={`/movies/${movie.id}`} className="relative block aspect-[2/3] overflow-hidden bg-zinc-800">
        {movie.posterUrl ? (
          <img
            src={movie.posterUrl}
            alt={`${movie.title} poster`}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-zinc-500">No poster</div>
        )}

        {/* Cinematic bottom fade, always present so the rating badge stays readable over any poster */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/80 to-transparent" />
        <span className="absolute bottom-2 left-2 rounded-md bg-black/60 px-1.5 py-0.5 text-xs font-semibold text-amber-400 backdrop-blur-sm">
          ★ {movie.rating.toFixed(1)}
        </span>

        <WatchlistButton movieId={movie.id} className="absolute right-2 top-2" />
      </Link>

      <div className="flex flex-1 flex-col gap-1 p-3">
        <Link
          to={`/movies/${movie.id}`}
          className="line-clamp-1 font-semibold text-zinc-100 transition-colors group-hover:text-emerald-400"
        >
          {movie.title}
        </Link>
        <p className="line-clamp-1 text-sm text-zinc-400">
          {movie.director} · {movie.releaseYear}
        </p>

        <div className="mt-1 flex flex-wrap gap-1">
          {movie.genres.map((genre) => (
            <span key={genre.id} className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300">
              {genre.name}
            </span>
          ))}
        </div>

        {isAdmin && (
          <div className="mt-auto flex gap-2 pt-3">
            <button
              type="button"
              onClick={() => onEdit(movie)}
              className="flex-1 rounded-md border border-zinc-700 px-2 py-1 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-600 hover:bg-zinc-800"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => onDelete(movie)}
              className="flex-1 rounded-md border border-red-900/60 px-2 py-1 text-xs font-medium text-red-400 transition-colors hover:bg-red-950/50"
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
