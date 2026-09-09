import type { Response } from 'express';

export const AUTH_COOKIE_NAME = 'token';

function cookieOptions(maxAgeMs?: number) {
  return {
    httpOnly: true,
    // Keyed off COOKIE_SECURE, not NODE_ENV: docker-compose sets
    // NODE_ENV=production even though this deployment has no real TLS
    // termination in front of it, so `secure: NODE_ENV === 'production'`
    // would silently break the cookie over plain http://localhost.
    secure: process.env.COOKIE_SECURE === 'true',
    // Sufficient (not a compromise) specifically because the client and API
    // are same-origin via the nginx/Vite `/api` proxy — see nginx.conf and
    // vite.config.ts.
    sameSite: 'lax' as const,
    path: '/',
    ...(maxAgeMs !== undefined ? { maxAge: maxAgeMs } : {}),
  };
}

export function setAuthCookie(res: Response, token: string, maxAgeMs: number): void {
  res.cookie(AUTH_COOKIE_NAME, token, cookieOptions(maxAgeMs));
}

export function clearAuthCookie(res: Response): void {
  // Options must match what was used to set the cookie (name/path/sameSite/
  // secure) — a mismatch here is a common bug where "logout" silently
  // doesn't clear anything.
  res.clearCookie(AUTH_COOKIE_NAME, cookieOptions());
}
