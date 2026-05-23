// ─── Authorization Middleware ───────────────────────────────────────────────
// Role-based access control. Must be used AFTER authenticate middleware.

import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/api-error';
import type { UserRole } from '../types/auth';

/**
 * Returns middleware that checks if the authenticated user has one of the allowed roles.
 *
 * @example
 * router.get('/admin/users', authenticate, authorize('admin'), controller.listUsers);
 * router.get('/dashboard', authenticate, authorize('seller', 'admin'), controller.dashboard);
 */
export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.userId || !req.userRole) {
      next(ApiError.unauthorized('Authentication required'));
      return;
    }

    if (!allowedRoles.includes(req.userRole as UserRole)) {
      next(
        ApiError.forbidden(
          `Access denied. Required role(s): ${allowedRoles.join(', ')}. Your role: ${req.userRole}`
        )
      );
      return;
    }

    next();
  };
};

export default authorize;
