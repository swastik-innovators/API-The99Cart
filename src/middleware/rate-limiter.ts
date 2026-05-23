// ─── Rate Limiter Middleware ────────────────────────────────────────────────
// Protects against brute-force and DDoS attacks.

import rateLimit from 'express-rate-limit';
import { config } from '../config';
import { ApiResponse } from '../utils/api-response';
import { Request, Response } from 'express';

/**
 * Global rate limiter — applied to all routes.
 */
export const globalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  standardHeaders: true,    // Return rate-limit info in `RateLimit-*` headers
  legacyHeaders: false,     // Disable `X-RateLimit-*` headers
  skipSuccessfulRequests: false,
  handler: (_req: Request, res: Response) => {
    ApiResponse.error(
      res,
      'Too many requests. Please try again later.',
      429
    );
  },
});

/**
 * Strict rate limiter — for sensitive endpoints (login, signup, etc.)
 */
export const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,                   // 10 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, res: Response) => {
    ApiResponse.error(
      res,
      'Too many attempts. Please try again after 15 minutes.',
      429
    );
  },
});

export default globalLimiter;
