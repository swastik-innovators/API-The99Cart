// ─── Express Application ───────────────────────────────────────────────────
// Configures and exports the Express app (separate from server for testability).

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import swaggerUi from 'swagger-ui-express';

import { config } from './config';
import { corsOptions } from './config/cors';
import { swaggerSpec } from './config/swagger';
import {
  errorHandler,
  globalLimiter,
  requestLogger,
  notFoundHandler,
} from './middleware';
import routes from './routes';

// ── Create Express App ─────────────────────────────────────────────────────
const app = express();

// ── Security ───────────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: config.isProduction ? undefined : false,
  crossOriginEmbedderPolicy: false,
}));
app.use(cors(corsOptions));

// ── Rate Limiting ──────────────────────────────────────────────────────────
app.use(globalLimiter);

// ── Body Parsing ───────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Cookies ────────────────────────────────────────────────────────────────
app.use(cookieParser(config.cookie.secret));

// ── Compression ────────────────────────────────────────────────────────────
app.use(compression());

// ── Request Logging ────────────────────────────────────────────────────────
app.use(requestLogger);

// ── Trust proxy (for rate-limiter behind reverse proxy) ────────────────────
app.set('trust proxy', 1);

// ── Swagger Docs ───────────────────────────────────────────────────────────
app.use(
  `/api/${config.apiVersion}/docs`,
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'The99cart API Docs',
  })
);

// ── API Routes ─────────────────────────────────────────────────────────────
app.use(`/api/${config.apiVersion}`, routes);

// ── 404 Handler ────────────────────────────────────────────────────────────
app.use(notFoundHandler);

// ── Global Error Handler (MUST be last) ────────────────────────────────────
app.use(errorHandler);

export default app;

