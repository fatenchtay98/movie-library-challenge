import { z } from 'zod';

// Length only, deliberately no forced complexity (uppercase/number/symbol)
// rules — current guidance (NIST 800-63B) treats those as more annoying
// than protective; length is what actually matters.
export const registerSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(8),
});
export type RegisterInput = z.infer<typeof registerSchema>;

// Presence only — login shouldn't leak the registration password policy,
// and an existing user's real password might predate whatever it is now.
export const loginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof loginSchema>;
