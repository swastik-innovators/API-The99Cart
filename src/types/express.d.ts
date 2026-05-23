// ─── Express Type Extensions ───────────────────────────────────────────────
// Augment Express Request with custom properties used across the app.

import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      /** Authenticated user ID from Supabase JWT */
      userId?: string;
      /** Authenticated user's role */
      userRole?: string;
      /** Unique request ID for tracing */
      requestId?: string;
    }
  }
}

export {};
