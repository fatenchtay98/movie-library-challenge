import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { useAuth } from '../api/auth';
import { useDeleteMovie, useMovie, useUpdateMovie } from '../api/movies';
import { useDeleteRating, useMyRatings, useSetRating } from '../api/ratings';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Modal } from '../components/Modal';
import { MovieForm } from '../components/MovieForm';
import { StarRatingInput } from '../components/StarRatingInput';
import { WatchlistButton } from '../components/WatchlistButton';
import type { MovieFormSchema } from '../schemas/movieFormSchema';

export function MovieDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin, isAuthenticated } = useAuth();
  const { data: movie, isLoading, isError } = useMovie(id);

  const updateMovie = useUpdateMovie();
  const deleteMovie = useDeleteMovie();
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const { data: myRatings } = useMyRatings();
  const setRating = useSetRating();
  const deleteRating = useDeleteRating();
  const myRating = myRatings?.find((r) => r.movieId === id)?.stars ?? 0;

  if (isLoading) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-6">
        <div className="mb-4 h-4 w-32 animate-pulse rounded bg-zinc-800" />
        <div className="flex flex-col gap-6 sm:flex-row">
          <div className="aspect-[2/3] w-full max-w-xs shrink-0 animate-pulse rounded-lg bg-zinc-800" />
          <div className="flex-1 space-y-3">
            <div className="h-7 w-2/3 animate-pulse rounded bg-zinc-800" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-zinc-800" />
            <div className="h-4 w-1/4 animate-pulse rounded bg-zinc-800" />
            <div className="h-20 w-full animate-pulse rounded bg-zinc-800" />
          </div>
        </div>
      </main>
    );
  }

  if (isError || !movie) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-12 text-center">
        <p className="text-zinc-500">Movie not found.</p>
        <Link to="/" className="mt-4 inline-block text-sm font-medium text-emerald-400 hover:underline">
          Back to library
        </Link>
      </main>
    );
  }

  function handleEditSubmit(values: MovieFormSchema) {
    if (!movie) return;
    updateMovie.mutate(
      {
        id: movie.id,
        input: {
          ...values,
          description: values.description || undefined,
          posterUrl: values.posterUrl || undefined,
        },
      },
      { onSuccess: () => setIsEditing(false) },
    );
  }

  function handleConfirmDelete() {
    if (!movie) return;
    deleteMovie.mutate(movie.id, { onSuccess: () => navigate('/') });
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-6">
      <Link to="/" className="mb-4 inline-block text-sm text-zinc-400 transition-colors hover:text-zinc-200">
        ← Back to library
      </Link>

      <div className="flex flex-col gap-6 sm:flex-row">
        <div className="aspect-[2/3] w-full max-w-xs shrink-0 overflow-hidden rounded-lg bg-zinc-800 shadow-lg shadow-black/40">
          {movie.posterUrl ? (
            <img src={movie.posterUrl} alt={`${movie.title} poster`} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-zinc-500">No poster</div>
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-2xl font-semibold text-zinc-100">{movie.title}</h1>
            <WatchlistButton movieId={movie.id} className="shrink-0" />
          </div>
          <p className="mt-1 text-zinc-400">
            {movie.director} · {movie.releaseYear} · {movie.durationMinutes} min
          </p>
          <p className="mt-1 text-lg font-medium text-amber-400">★ {movie.rating.toFixed(1)}</p>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {movie.genres.map((genre) => (
              <span key={genre.id} className="rounded-full bg-zinc-800 px-2.5 py-1 text-xs text-zinc-300">
                {genre.name}
              </span>
            ))}
          </div>

          {isAuthenticated && (
            <div className="mt-4">
              <p className="mb-1 text-xs font-medium text-zinc-500">Your rating</p>
              <StarRatingInput
                value={myRating}
                isPending={setRating.isPending || deleteRating.isPending}
                onChange={(stars) => setRating.mutate({ movieId: movie.id, stars })}
                onClear={() => deleteRating.mutate(movie.id)}
              />
            </div>
          )}

          {movie.description && <p className="mt-4 text-sm leading-relaxed text-zinc-300">{movie.description}</p>}

          {isAdmin && (
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="rounded-md border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-600 hover:bg-zinc-800"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => setIsConfirmingDelete(true)}
                className="rounded-md border border-red-900/60 px-4 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-950/50"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {isEditing && (
        <Modal title="Edit Movie" onClose={() => setIsEditing(false)}>
          <MovieForm
            initialMovie={movie}
            isSubmitting={updateMovie.isPending}
            submitLabel="Save changes"
            onSubmit={handleEditSubmit}
            onCancel={() => setIsEditing(false)}
          />
        </Modal>
      )}

      {isConfirmingDelete && (
        <ConfirmDialog
          title="Delete movie"
          message={`Are you sure you want to delete "${movie.title}"? This can't be undone.`}
          confirmLabel="Delete"
          isLoading={deleteMovie.isPending}
          onConfirm={handleConfirmDelete}
          onCancel={() => setIsConfirmingDelete(false)}
        />
      )}
    </main>
  );
}
