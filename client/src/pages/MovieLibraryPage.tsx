import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { useAuth } from '../api/auth';
import { useGenres } from '../api/genres';
import { useCreateMovie, useDeleteMovie, useMovies, useUpdateMovie } from '../api/movies';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Modal } from '../components/Modal';
import { MovieCard } from '../components/MovieCard';
import { MovieCardSkeleton } from '../components/MovieCardSkeleton';
import { MovieFilters } from '../components/MovieFilters';
import { MovieForm } from '../components/MovieForm';
import { Pagination } from '../components/Pagination';
import { useDebounce } from '../hooks/useDebounce';
import type { MovieFormSchema } from '../schemas/movieFormSchema';
import type { Movie, MovieListParams } from '../types';

const PAGE_SIZE = 20;

type FormModalState = { mode: 'create' } | { mode: 'edit'; movie: Movie } | null;

export function MovieLibraryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAdmin } = useAuth();
  const { data: genres = [] } = useGenres();

  const searchParam = searchParams.get('search') ?? '';
  const yearParam = searchParams.get('year') ?? '';
  const genre = searchParams.get('genre') ?? '';
  const sortBy = (searchParams.get('sortBy') as MovieListParams['sortBy']) ?? 'title';
  const sortOrder = (searchParams.get('sortOrder') as MovieListParams['sortOrder']) ?? 'asc';
  const page = Number(searchParams.get('page') ?? '1') || 1;

  const [searchInput, setSearchInput] = useState(searchParam);
  const [yearInput, setYearInput] = useState(yearParam);
  const debouncedSearch = useDebounce(searchInput, 400);
  const debouncedYear = useDebounce(yearInput, 400);

  // Two-way sync with the URL: our own debounced writes flow in below, and
  // external changes (back/forward navigation) flow back into the inputs
  // here without looping, since a self-triggered update leaves the values
  // already equal.
  useEffect(() => setSearchInput(searchParam), [searchParam]);
  useEffect(() => setYearInput(yearParam), [yearParam]);

  function updateParams(patch: Record<string, string | undefined>, resetPage = true) {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        for (const [key, value] of Object.entries(patch)) {
          if (value) next.set(key, value);
          else next.delete(key);
        }
        if (resetPage) next.set('page', '1');
        return next;
      },
      { replace: true },
    );
  }

  useEffect(() => {
    if (debouncedSearch !== searchParam) updateParams({ search: debouncedSearch });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  useEffect(() => {
    if (debouncedYear !== yearParam) updateParams({ year: debouncedYear });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedYear]);

  const movieListParams: MovieListParams = {
    ...(searchParam ? { search: searchParam } : {}),
    ...(genre ? { genre } : {}),
    ...(yearParam ? { year: Number(yearParam) } : {}),
    sortBy,
    sortOrder,
    page,
    pageSize: PAGE_SIZE,
  };

  const { data, isLoading, isError } = useMovies(movieListParams);

  const [formModal, setFormModal] = useState<FormModalState>(null);
  const [deleteTarget, setDeleteTarget] = useState<Movie | null>(null);

  const createMovie = useCreateMovie();
  const updateMovie = useUpdateMovie();
  const deleteMovie = useDeleteMovie();

  function handleFormSubmit(values: MovieFormSchema) {
    const input = {
      ...values,
      description: values.description || undefined,
      posterUrl: values.posterUrl || undefined,
    };

    if (formModal?.mode === 'edit') {
      updateMovie.mutate(
        { id: formModal.movie.id, input },
        { onSuccess: () => setFormModal(null) },
      );
    } else {
      createMovie.mutate(input, { onSuccess: () => setFormModal(null) });
    }
  }

  function handleConfirmDelete() {
    if (!deleteTarget) return;
    deleteMovie.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-zinc-100">Movie Library</h1>
        {isAdmin && (
          <button
            type="button"
            onClick={() => setFormModal({ mode: 'create' })}
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-500"
          >
            + Add Movie
          </button>
        )}
      </div>

      <div className="mb-6">
        <MovieFilters
          searchInput={searchInput}
          onSearchInputChange={setSearchInput}
          genre={genre}
          onGenreChange={(value) => updateParams({ genre: value })}
          year={yearInput}
          onYearChange={setYearInput}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={(nextSortBy, nextSortOrder) =>
            updateParams({ sortBy: nextSortBy, sortOrder: nextSortOrder })
          }
          genres={genres}
        />
      </div>

      {isLoading && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 10 }, (_, i) => (
            <MovieCardSkeleton key={i} />
          ))}
        </div>
      )}

      {isError && (
        <p className="py-12 text-center text-red-400">
          Something went wrong loading movies. Please try again.
        </p>
      )}

      {!isLoading && !isError && data?.data.length === 0 && (
        <p className="py-12 text-center text-zinc-500">No movies match your filters.</p>
      )}

      {!isLoading && !isError && data && data.data.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {data.data.map((movie) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                isAdmin={isAdmin}
                onEdit={(m) => setFormModal({ mode: 'edit', movie: m })}
                onDelete={setDeleteTarget}
              />
            ))}
          </div>

          <div className="mt-6">
            <Pagination pagination={data.pagination} onPageChange={(p) => updateParams({ page: String(p) }, false)} />
          </div>
        </>
      )}

      {formModal && (
        <Modal title={formModal.mode === 'create' ? 'Add Movie' : 'Edit Movie'} onClose={() => setFormModal(null)}>
          <MovieForm
            initialMovie={formModal.mode === 'edit' ? formModal.movie : undefined}
            isSubmitting={createMovie.isPending || updateMovie.isPending}
            submitLabel={formModal.mode === 'create' ? 'Create' : 'Save changes'}
            onSubmit={handleFormSubmit}
            onCancel={() => setFormModal(null)}
          />
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete movie"
          message={`Are you sure you want to delete "${deleteTarget.title}"? This can't be undone.`}
          confirmLabel="Delete"
          isLoading={deleteMovie.isPending}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </main>
  );
}
