// ─── Authentication Middleware ──────────────────────────────────────────────
// Verifies JWT from Authorization header or signed cookie.

import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';
import { supabaseAdmin } from '../config/supabase';
import { ApiError } from '../utils/api-error';
import { logger } from '../config/logger';

/**
 * Extracts and verifies the Supabase JWT.
 * Populates `req.userId` and `req.userRole` on success.
 */
export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // 1. Extract token from Authorization header or cookie
    const token = extractToken(req);

    if (!token) {
      throw ApiError.unauthorized('Authentication required — no token provided');
    }

    // 2. Verify token with Supabase
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      logger.warn('JWT verification failed', { error: error?.message });
      throw ApiError.unauthorized('Invalid or expired token');
    }

    // 3. Fetch user role from profiles
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single();

    // 4. Populate request
    req.userId = data.user.id;
    req.userRole = profile?.role || 'customer';

    next();
  } catch (err) {
    if (err instanceof ApiError) {
      next(err);
    } else {
      next(ApiError.unauthorized('Authentication failed'));
    }
  }
};

/**
 * Extract Bearer token from header or signed cookie.
 */
function extractToken(req: Request): string | null {
  // Check Authorization header first
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  // Fall back to signed cookie
  if (req.signedCookies?.['access_token']) {
    return req.signedCookies['access_token'] as string;
  }

  return null;
}

export default authenticate;
