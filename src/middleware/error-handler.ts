// ─── Global Error Handler Middleware ────────────────────────────────────────
// Catches all errors and sends a consistent JSON response.

import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/api-error';
import { ApiResponse } from '../utils/api-response';
import { logger } from '../config/logger';
import { config } from '../config';

export const errorHandler = (
  err: Error | ApiError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // ── ApiError (expected, operational) ───────────────────────────────────
  if (err instanceof ApiError) {
    logger.warn(`ApiError [${err.statusCode}]: ${err.message}`, {
      statusCode: err.statusCode,
      errors: err.errors,
    });

    ApiResponse.error(res, err.message, err.statusCode, err.errors);
    return;
  }

  // ── Syntax Error (malformed JSON body) ────────────────────────────────
  if (err instanceof SyntaxError && 'body' in err) {
    logger.warn('Malformed JSON in request body');
    ApiResponse.error(res, 'Malformed JSON in request body', 400);
    return;
  }

  // ── Unknown / unhandled error ─────────────────────────────────────────
  logger.error('Unhandled error', {
    name: err.name,
    message: err.message,
    stack: err.stack,
  });

  const message = config.isProduction
    ? 'Internal server error'
    : err.message || 'Internal server error';

  ApiResponse.error(res, message, 500);
};

export default errorHandler;
