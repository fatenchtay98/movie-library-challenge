import jwt from 'jsonwebtoken';

import type { Role } from '../generated/prisma/client.js';

export interface AuthTokenPayload {
  sub: string;
  email: string;
  role: Role;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set`);
  }
  return value;
}

const JWT_SECRET = requireEnv('JWT_SECRET');
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '1h';

export function signToken(payload: AuthTokenPayload): { token: string; maxAgeMs: number } {
  const token = jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  } as jwt.SignOptions);

  // Derive the cookie's maxAge from the token's own `exp` claim rather than
  // re-parsing JWT_EXPIRES_IN separately, so the two can't drift apart.
  const decoded = jwt.decode(token) as { exp: number };
  const maxAgeMs = decoded.exp * 1000 - Date.now();

  return { token, maxAgeMs };
}

export function verifyToken(token: string): AuthTokenPayload {
  return jwt.verify(token, JWT_SECRET) as unknown as AuthTokenPayload;
}
