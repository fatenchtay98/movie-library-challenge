export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// Always relative /api/... — nginx (Docker) and Vite's dev proxy both
// forward it to the server, so the client never needs to know the API's
// actual origin.
export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });

  if (res.status === 204) {
    return undefined as T;
  }

  const body: unknown = await res.json().catch(() => null);

  if (!res.ok) {
    const message =
      body && typeof body === 'object' && 'error' in body && typeof body.error === 'string'
        ? body.error
        : 'Request failed';
    throw new ApiError(res.status, message);
  }

  return body as T;
}
