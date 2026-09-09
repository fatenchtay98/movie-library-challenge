import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

// Precomputed once and compared against on every login where the user isn't
// found, so response timing doesn't reveal whether an email is registered.
const DUMMY_HASH = await bcrypt.hash('dummy-password-for-timing-safety', SALT_ROUNDS);

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function verifyDummyPassword(plain: string): Promise<boolean> {
  return bcrypt.compare(plain, DUMMY_HASH);
}
