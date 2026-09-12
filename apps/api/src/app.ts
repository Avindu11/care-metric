import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

import { env } from './config/env.js';
import { logger } from './lib/logger.js';
import { pinoHttp } from 'pino-http';

import { providersRouter } from './modules/providers/providers.routes.js';
import { facilitiesRouter } from './modules/facilities/facilities.routes.js';
import { appointmentsRouter } from './modules/appointments/appointments.routes.js';
import { analyticsRouter } from './modules/analytics/analytics.routes.js';

export const app: express.Express = express();

app.disable('x-powered-by');

if (env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Request logging (skip in test mode to keep test output clean)
if (env.NODE_ENV !== 'test') {
  app.use(
    pinoHttp({
      logger,
    }),
  );
}

app.use(helmet());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server) or matching origin
      if (!origin || origin === env.WEB_ORIGIN || origin.startsWith('http://localhost')) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
  }),
);

app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Rate limiting
if (env.NODE_ENV !== 'test') {
  app.use(
    rateLimit({
      windowMs: 60 * 1000,
      limit: 1000,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );
}

// Health check endpoints
const healthHandler = (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
};

app.get('/api/health', healthHandler);
app.get('/api/v1/health', healthHandler);

// Mount API modules
app.use('/api/providers', providersRouter);
app.use('/api/facilities', facilitiesRouter);
app.use('/api/appointments', appointmentsRouter);
app.use('/api/analytics', analyticsRouter);

// 404 Handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'Resource not found',
    },
  });
});

// Centralized Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  logger.error({ err }, 'Unhandled API error');

  const statusCode = err.status || err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message =
    env.NODE_ENV === 'production' && statusCode === 500
      ? 'An unexpected error occurred'
      : err.message || 'Internal server error';

  res.status(statusCode).json({
    error: {
      code,
      message,
    },
  });
});