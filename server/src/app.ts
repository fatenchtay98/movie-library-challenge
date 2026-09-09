import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type Express } from 'express';
import swaggerUi from 'swagger-ui-express';

import { prisma } from './lib/prisma.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/logger.js';
import { generateOpenApiDocument } from './openapi/document.js';
import { authRouter } from './routes/authRoutes.js';
import { genreRouter } from './routes/genreRoutes.js';
import { movieRouter } from './routes/movieRoutes.js';
import { ratingRouter } from './routes/ratingRoutes.js';
import { watchlistRouter } from './routes/watchlistRoutes.js';

export const app: Express = express();

app.use(requestLogger);
app.use(
  cors({
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.json());

// Verifies both the API process and its DB connection are up — the thing to
// curl after `docker compose up` to confirm the stack is wired correctly.
app.get('/api/health', async (_req, res, next) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', db: 'connected' });
  } catch (err) {
    next(err);
  }
});

app.use('/api/auth', authRouter);
app.use('/api/movies', movieRouter);
app.use('/api/genres', genreRouter);
app.use('/api', watchlistRouter);
app.use('/api', ratingRouter);

const openApiDocument = generateOpenApiDocument();
app.get('/api/docs/openapi.json', (_req, res) => res.json(openApiDocument));
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));

app.use(notFoundHandler);
app.use(errorHandler);
