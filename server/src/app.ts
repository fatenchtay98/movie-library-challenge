import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type Express } from 'express';

import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/logger';

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

// Liveness only for now — Prisma Client can't even be generated without at
// least one model (`prisma generate` errors on an empty schema), so a real
// DB-connectivity check has to wait for the actual schema next phase.
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use(notFoundHandler);
app.use(errorHandler);
