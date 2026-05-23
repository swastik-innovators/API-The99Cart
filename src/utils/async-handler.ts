// ─── Async Handler ─────────────────────────────────────────────────────────
// Wraps async route handlers to forward rejected promises to Express error middleware.

import { Request, Response, NextFunction, RequestHandler } from 'express';

type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<unknown>;

/**
 * Wrap an async controller so thrown errors are caught
 * and forwarded to the global error handler.
 */
export const asyncHandler = (fn: AsyncRequestHandler): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default asyncHandler;
