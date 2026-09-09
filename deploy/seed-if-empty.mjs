// Render-only: the free plan has no Shell/SSH and no one-off jobs, so
// there's no way to run `npm run prisma:seed` by hand after the first
// deploy. This runs on every container start (see start.sh) but only
// actually seeds when the movies table is empty — local dev keeps using
// the unguarded `npm run prisma:seed` directly (see README/DECISIONS.md),
// which is still fine to force-rerun on demand. This wrapper exists so the
// exact same destructive reseed never fires again after the first
// successful boot, which matters here because Render's free-tier
// containers restart on every wake-from-sleep.
import { execSync } from 'node:child_process';

import { prisma } from '../dist/lib/prisma.js';

const count = await prisma.movie.count();

if (count === 0) {
  console.log('No movies found — running prisma:seed once...');
  execSync('npx tsx prisma/seed.ts', { stdio: 'inherit' });
} else {
  console.log(`Movies already seeded (${count} found) — skipping.`);
}

await prisma.$disconnect();
