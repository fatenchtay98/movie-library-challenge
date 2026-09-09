import { PrismaClient } from '@prisma/client';

// Single shared instance — re-instantiating PrismaClient per request exhausts
// the Postgres connection pool.
export const prisma = new PrismaClient();
