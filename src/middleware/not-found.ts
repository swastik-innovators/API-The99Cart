// ─── 404 Not Found Middleware ───────────────────────────────────────────────
// Catches requests to undefined routes.

import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/api-error';

export const notFoundHandler = (req: Request, _res: Response, next: NextFunction): void => {
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} not found`));
};

export default notFoundHandler;
