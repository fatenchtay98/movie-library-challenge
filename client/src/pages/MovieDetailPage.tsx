import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { useAuth } from '../api/auth';
import { useDeleteMovie, useMovie, useUpdateMovie } from '../api/movies';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Modal } from '../components/Modal';
import { MovieForm } from '../components/MovieForm';
import type { MovieFormSchema } from '../schemas/movieFormSchema';

export function MovieDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { data: movie, isLoading, isError } = useMovie(id);

  const updateMovie = useUpdateMovie();
  const deleteMovie = useDeleteMovie();
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  if (isLoading) {
    return <p className="py-12 text-center text-slate-500">Loading…</p>;
  }

  if (isError || !movie) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-12 text-center">
        <p className="text-slate-500">Movie not found.</p>
        <Link to="/" className="mt-4 inline-block text-sm font-medium text-slate-700 underline">
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
      <Link to="/" className="mb-4 inline-block text-sm text-slate-500 hover:text-slate-700">
        ← Back to library
      </Link>

      <div className="flex flex-col gap-6 sm:flex-row">
        <div className="aspect-[2/3] w-full max-w-xs shrink-0 overflow-hidden rounded-lg bg-slate-100">
          {movie.posterUrl ? (
            <img src={movie.posterUrl} alt={`${movie.title} poster`} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-slate-400">No poster</div>
          )}
        </div>

        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-slate-900">{movie.title}</h1>
          <p className="mt-1 text-slate-500">
            {movie.director} · {movie.releaseYear} · {movie.durationMinutes} min
          </p>
          <p className="mt-1 text-lg font-medium text-amber-600">★ {movie.rating.toFixed(1)}</p>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {movie.genres.map((genre) => (
              <span key={genre.id} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                {genre.name}
              </span>
            ))}
          </div>

          {movie.description && <p className="mt-4 text-sm leading-relaxed text-slate-700">{movie.description}</p>}

          {isAdmin && (
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => setIsConfirmingDelete(true)}
                className="rounded-md border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
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
