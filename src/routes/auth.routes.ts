// ─── Auth Routes ───────────────────────────────────────────────────────────
// All authentication endpoints with validation and rate limiting.

import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/authenticate';
import { strictLimiter } from '../middleware/rate-limiter';
import {
  registerSchema,
  loginSchema,
  googleAuthSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
} from '../validators/auth.validator';

const router = Router();

// ── Public Routes (rate-limited) ───────────────────────────────────────────

/**
 * POST /auth/register
 * Create a new user account.
 */
router.post(
  '/register',
  strictLimiter,
  validate(registerSchema),
  authController.register
);

/**
 * POST /auth/login
 * Authenticate with email and password.
 */
router.post(
  '/login',
  strictLimiter,
  validate(loginSchema),
  authController.login
);

/**
 * POST /auth/google
 * Authenticate with Google ID token.
 */
router.post(
  '/google',
  strictLimiter,
  validate(googleAuthSchema),
  authController.googleLogin
);

/**
 * POST /auth/refresh-token
 * Refresh access token using refresh token.
 */
router.post(
  '/refresh-token',
  authController.refreshToken
);

/**
 * POST /auth/forgot-password
 * Send a password reset email.
 */
router.post(
  '/forgot-password',
  strictLimiter,
  validate(forgotPasswordSchema),
  authController.forgotPassword
);

/**
 * POST /auth/reset-password
 * Reset password using the token from the email link.
 */
router.post(
  '/reset-password',
  strictLimiter,
  validate(resetPasswordSchema),
  authController.resetPassword
);

// ── Protected Routes ───────────────────────────────────────────────────────

/**
 * POST /auth/logout
 * Invalidate current session.
 */
router.post(
  '/logout',
  authenticate,
  authController.logout
);

/**
 * GET /auth/profile
 * Get authenticated user's profile.
 */
router.get(
  '/profile',
  authenticate,
  authController.getProfile
);

/**
 * PATCH /auth/profile
 * Update authenticated user's profile.
 */
router.patch(
  '/profile',
  authenticate,
  validate(updateProfileSchema),
  authController.updateProfile
);

export default router;
