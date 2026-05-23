// ─── Auth Controller ───────────────────────────────────────────────────────
// Route handlers for all authentication endpoints.

import { Request, Response } from 'express';
import { asyncHandler } from '../utils/async-handler';
import { ApiResponse } from '../utils/api-response';
import { authService } from '../services/auth.service';
import { config } from '../config';
import { COOKIE_DEFAULTS } from '../utils/constants';

// ── POST /auth/register ────────────────────────────────────────────────────
export const register = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.register(req.body);

  if (result.tokens) {
    setAuthCookies(res, result.tokens.access_token, result.tokens.refresh_token);
  }

  ApiResponse.created(res, result, 'Registration successful. Please verify your email.');
});

// ── POST /auth/login ───────────────────────────────────────────────────────
export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.login(req.body);

  setAuthCookies(res, result.tokens!.access_token, result.tokens!.refresh_token);

  ApiResponse.success(res, result, 'Login successful');
});

// ── POST /auth/google ──────────────────────────────────────────────────────
export const googleLogin = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.googleLogin(req.body);

  setAuthCookies(res, result.tokens!.access_token, result.tokens!.refresh_token);

  ApiResponse.success(res, result, 'Google login successful');
});

// ── POST /auth/logout ──────────────────────────────────────────────────────
export const logout = asyncHandler(async (req: Request, res: Response) => {
  const token =
    req.headers.authorization?.replace('Bearer ', '') ||
    (req.signedCookies?.['access_token'] as string | undefined) ||
    '';

  await authService.logout(token);

  clearAuthCookies(res);

  ApiResponse.success(res, null, 'Logged out successfully');
});

// ── POST /auth/refresh-token ───────────────────────────────────────────────
export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  // Accept refresh_token from body or cookie
  const refresh = req.body.refresh_token || req.signedCookies?.['refresh_token'];

  const result = await authService.refreshToken({ refresh_token: refresh });

  setAuthCookies(res, result.tokens!.access_token, result.tokens!.refresh_token);

  ApiResponse.success(res, result, 'Token refreshed successfully');
});

// ── POST /auth/forgot-password ─────────────────────────────────────────────
export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  await authService.forgotPassword(req.body);

  // Always return success to prevent email enumeration
  ApiResponse.success(
    res,
    null,
    'If an account with that email exists, a password reset link has been sent.'
  );
});

// ── POST /auth/reset-password ──────────────────────────────────────────────
export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  await authService.resetPassword(req.body);

  clearAuthCookies(res);

  ApiResponse.success(res, null, 'Password has been reset successfully. Please log in again.');
});

// ── GET /auth/profile ──────────────────────────────────────────────────────
export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const profile = await authService.getProfile(req.userId!);

  ApiResponse.success(res, profile, 'Profile retrieved');
});

// ── PATCH /auth/profile ────────────────────────────────────────────────────
export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const profile = await authService.updateProfile(req.userId!, req.body);

  ApiResponse.success(res, profile, 'Profile updated successfully');
});

// ── Cookie Helpers ─────────────────────────────────────────────────────────

function setAuthCookies(res: Response, accessToken: string, refreshToken: string): void {
  res.cookie('access_token', accessToken, {
    ...COOKIE_DEFAULTS,
    maxAge: 60 * 60 * 1000, // 1 hour
    signed: true,
    secure: config.isProduction,
  });

  res.cookie('refresh_token', refreshToken, {
    ...COOKIE_DEFAULTS,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    signed: true,
    secure: config.isProduction,
  });
}

function clearAuthCookies(res: Response): void {
  const isProd = process.env.NODE_ENV === 'production';
  const domain = isProd ? '.the99cart.com' : (process.env.COOKIE_DOMAIN || undefined);
  res.clearCookie('access_token', { path: '/', domain });
  res.clearCookie('refresh_token', { path: '/', domain });
}
