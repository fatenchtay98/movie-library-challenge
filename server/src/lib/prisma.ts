import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../generated/prisma/client.js';

// Prisma 7 requires an explicit driver adapter — there's no more
// direct-URL-only connection mode.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

// Single shared instance — re-instantiating PrismaClient per request exhausts
// the Postgres connection pool.
export const prisma = new PrismaClient({ adapter });
