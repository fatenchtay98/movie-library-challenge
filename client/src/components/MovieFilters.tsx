import type { Genre, MovieListParams } from '../types';

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: 'title-asc', label: 'Title (A–Z)' },
  { value: 'title-desc', label: 'Title (Z–A)' },
  { value: 'releaseYear-desc', label: 'Newest first' },
  { value: 'releaseYear-asc', label: 'Oldest first' },
  { value: 'rating-desc', label: 'Highest rated' },
  { value: 'rating-asc', label: 'Lowest rated' },
];

interface MovieFiltersProps {
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  genre: string;
  onGenreChange: (value: string) => void;
  year: string;
  onYearChange: (value: string) => void;
  sortBy: NonNullable<MovieListParams['sortBy']>;
  sortOrder: NonNullable<MovieListParams['sortOrder']>;
  onSortChange: (sortBy: NonNullable<MovieListParams['sortBy']>, sortOrder: NonNullable<MovieListParams['sortOrder']>) => void;
  genres: Genre[];
}

export function MovieFilters({
  searchInput,
  onSearchInputChange,
  genre,
  onGenreChange,
  year,
  onYearChange,
  sortBy,
  sortOrder,
  onSortChange,
  genres,
}: MovieFiltersProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <input
        type="search"
        value={searchInput}
        onChange={(e) => onSearchInputChange(e.target.value)}
        placeholder="Search title or director…"
        aria-label="Search movies"
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm sm:max-w-xs"
      />

      <select
        value={genre}
        onChange={(e) => onGenreChange(e.target.value)}
        aria-label="Filter by genre"
        className="rounded-md border border-slate-300 px-3 py-2 text-sm"
      >
        <option value="">All genres</option>
        {genres.map((g) => (
          <option key={g.id} value={g.name}>
            {g.name}
          </option>
        ))}
      </select>

      <input
        type="number"
        value={year}
        onChange={(e) => onYearChange(e.target.value)}
        placeholder="Year"
        aria-label="Filter by release year"
        className="w-24 rounded-md border border-slate-300 px-3 py-2 text-sm"
      />

      <select
        value={`${sortBy}-${sortOrder}`}
        onChange={(e) => {
          const [nextSortBy, nextSortOrder] = e.target.value.split('-') as [
            NonNullable<MovieListParams['sortBy']>,
            NonNullable<MovieListParams['sortOrder']>,
          ];
          onSortChange(nextSortBy, nextSortOrder);
        }}
        aria-label="Sort movies"
        className="rounded-md border border-slate-300 px-3 py-2 text-sm"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
