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

const fieldClass =
  'mt-1 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500';
const labelClass = 'block text-sm font-medium text-zinc-300';

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
        <label htmlFor="title" className={labelClass}>
          Title
        </label>
        <input id="title" {...register('title')} className={fieldClass} />
        {errors.title && <p className="mt-1 text-xs text-red-400">{errors.title.message}</p>}
      </div>

      <div>
        <label htmlFor="description" className={labelClass}>
          Description
        </label>
        <textarea id="description" {...register('description')} rows={3} className={fieldClass} />
        {errors.description && <p className="mt-1 text-xs text-red-400">{errors.description.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="director" className={labelClass}>
            Director
          </label>
          <input id="director" {...register('director')} className={fieldClass} />
          {errors.director && <p className="mt-1 text-xs text-red-400">{errors.director.message}</p>}
        </div>

        <div>
          <label htmlFor="releaseYear" className={labelClass}>
            Release year
          </label>
          <input id="releaseYear" type="number" {...register('releaseYear')} className={fieldClass} />
          {errors.releaseYear && <p className="mt-1 text-xs text-red-400">{errors.releaseYear.message}</p>}
        </div>

        <div>
          <label htmlFor="durationMinutes" className={labelClass}>
            Duration (minutes)
          </label>
          <input id="durationMinutes" type="number" {...register('durationMinutes')} className={fieldClass} />
          {errors.durationMinutes && (
            <p className="mt-1 text-xs text-red-400">{errors.durationMinutes.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="rating" className={labelClass}>
            Rating (0–10)
          </label>
          <input id="rating" type="number" step="0.1" {...register('rating')} className={fieldClass} />
          {errors.rating && <p className="mt-1 text-xs text-red-400">{errors.rating.message}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="posterUrl" className={labelClass}>
          Poster URL
        </label>
        <input id="posterUrl" {...register('posterUrl')} placeholder="https://…" className={fieldClass} />
        {errors.posterUrl && <p className="mt-1 text-xs text-red-400">{errors.posterUrl.message}</p>}
      </div>

      <fieldset>
        <legend className={labelClass}>Genres</legend>
        <div className="mt-1 flex flex-wrap gap-2">
          {genres.map((genre) => (
            <label
              key={genre.id}
              className="flex cursor-pointer items-center gap-1.5 rounded-md border border-zinc-700 px-2 py-1 text-sm text-zinc-300 transition-colors has-checked:border-emerald-500 has-checked:bg-emerald-600 has-checked:text-white"
            >
              <input type="checkbox" value={genre.id} {...register('genreIds')} className="sr-only" />
              {genre.name}
            </label>
          ))}
        </div>
        {errors.genreIds && <p className="mt-1 text-xs text-red-400">{errors.genreIds.message}</p>}
      </fieldset>

      <div className="mt-2 flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-600 hover:bg-zinc-800"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
        >
          {isSubmitting ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  );
}
