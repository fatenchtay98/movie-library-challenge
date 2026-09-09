import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { useGenres } from '../api/genres';
import { movieFormSchema, type MovieFormSchema } from '../schemas/movieFormSchema';
import type { Movie } from '../types';

interface MovieFormProps {
  initialMovie?: Movie;
  isSubmitting: boolean;
  submitLabel: string;
  onSubmit: (values: MovieFormSchema) => void;
  onCancel: () => void;
}

export function MovieForm({ initialMovie, isSubmitting, submitLabel, onSubmit, onCancel }: MovieFormProps) {
  const { data: genres = [] } = useGenres();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MovieFormSchema>({
    resolver: zodResolver(movieFormSchema),
    defaultValues: {
      title: initialMovie?.title ?? '',
      description: initialMovie?.description ?? '',
      releaseYear: initialMovie?.releaseYear ?? new Date().getFullYear(),
      director: initialMovie?.director ?? '',
      durationMinutes: initialMovie?.durationMinutes ?? 90,
      rating: initialMovie?.rating ?? 5,
      posterUrl: initialMovie?.posterUrl ?? '',
      genreIds: initialMovie?.genres.map((g) => g.id) ?? [],
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-slate-700">
          Title
        </label>
        <input
          id="title"
          {...register('title')}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-slate-700">
          Description
        </label>
        <textarea
          id="description"
          {...register('description')}
          rows={3}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        {errors.description && <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="director" className="block text-sm font-medium text-slate-700">
            Director
          </label>
          <input
            id="director"
            {...register('director')}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          {errors.director && <p className="mt-1 text-xs text-red-600">{errors.director.message}</p>}
        </div>

        <div>
          <label htmlFor="releaseYear" className="block text-sm font-medium text-slate-700">
            Release year
          </label>
          <input
            id="releaseYear"
            type="number"
            {...register('releaseYear')}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          {errors.releaseYear && <p className="mt-1 text-xs text-red-600">{errors.releaseYear.message}</p>}
        </div>

        <div>
          <label htmlFor="durationMinutes" className="block text-sm font-medium text-slate-700">
            Duration (minutes)
          </label>
          <input
            id="durationMinutes"
            type="number"
            {...register('durationMinutes')}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          {errors.durationMinutes && (
            <p className="mt-1 text-xs text-red-600">{errors.durationMinutes.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="rating" className="block text-sm font-medium text-slate-700">
            Rating (0–10)
          </label>
          <input
            id="rating"
            type="number"
            step="0.1"
            {...register('rating')}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          {errors.rating && <p className="mt-1 text-xs text-red-600">{errors.rating.message}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="posterUrl" className="block text-sm font-medium text-slate-700">
          Poster URL
        </label>
        <input
          id="posterUrl"
          {...register('posterUrl')}
          placeholder="https://…"
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        {errors.posterUrl && <p className="mt-1 text-xs text-red-600">{errors.posterUrl.message}</p>}
      </div>

      <fieldset>
        <legend className="block text-sm font-medium text-slate-700">Genres</legend>
        <div className="mt-1 flex flex-wrap gap-2">
          {genres.map((genre) => (
            <label
              key={genre.id}
              className="flex items-center gap-1.5 rounded-md border border-slate-300 px-2 py-1 text-sm has-checked:border-slate-900 has-checked:bg-slate-900 has-checked:text-white"
            >
              <input type="checkbox" value={genre.id} {...register('genreIds')} className="sr-only" />
              {genre.name}
            </label>
          ))}
        </div>
        {errors.genreIds && <p className="mt-1 text-xs text-red-600">{errors.genreIds.message}</p>}
      </fieldset>

      <div className="mt-2 flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {isSubmitting ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  );
}
