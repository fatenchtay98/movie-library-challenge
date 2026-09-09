export type Role = 'ADMIN' | 'USER';

export interface PublicUser {
  id: string;
  email: string;
  role: Role;
  createdAt: string;
}

export interface Genre {
  id: string;
  name: string;
}

export interface Movie {
  id: string;
  title: string;
  description: string | null;
  releaseYear: number;
  director: string;
  durationMinutes: number;
  rating: number;
  posterUrl: string | null;
  createdAt: string;
  updatedAt: string;
  genres: Genre[];
}

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface MovieListResponse {
  data: Movie[];
  pagination: Pagination;
}

export interface MovieListParams {
  search?: string;
  genre?: string;
  year?: number;
  sortBy?: 'title' | 'releaseYear' | 'rating' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface MovieFormValues {
  title: string;
  description?: string;
  releaseYear: number;
  director: string;
  durationMinutes: number;
  rating: number;
  posterUrl?: string;
  genreIds: string[];
}

export interface MovieRatingEntry {
  movieId: string;
  stars: number;
}
