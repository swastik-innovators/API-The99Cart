// ─── Auth Validators ───────────────────────────────────────────────────────
// Zod schemas for all authentication endpoints.

import { z } from 'zod';

// ── Shared Schemas ─────────────────────────────────────────────────────────

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be 128 characters or fewer')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

const emailField = z
  .string()
  .email('Invalid email format')
  .max(255, 'Email must be 255 characters or fewer')
  .transform((v) => v.toLowerCase().trim());

const roleField = z.enum(['customer', 'seller', 'admin']).default('customer');

// ── Registration ───────────────────────────────────────────────────────────

export const registerSchema = z.object({
  email: emailField,
  password: passwordSchema,
  full_name: z
    .string()
    .trim()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must be 100 characters or fewer'),
  phone: z
    .string()
    .regex(/^\+[1-9]\d{1,14}$/, 'Phone must be in E.164 format (e.g. +919876543210)')
    .optional(),
  role: roleField,
});

export type RegisterInput = z.infer<typeof registerSchema>;

// ── Login ──────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;

// ── Google OAuth ───────────────────────────────────────────────────────────

export const googleAuthSchema = z.object({
  id_token: z.string().min(1, 'Google ID token is required'),
  role: roleField,
});

export type GoogleAuthInput = z.infer<typeof googleAuthSchema>;

// ── Refresh Token ──────────────────────────────────────────────────────────

export const refreshTokenSchema = z.object({
  refresh_token: z.string().min(1, 'Refresh token is required'),
});

export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;

// ── Forgot Password ────────────────────────────────────────────────────────

export const forgotPasswordSchema = z.object({
  email: emailField,
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

// ── Reset Password ─────────────────────────────────────────────────────────

export const resetPasswordSchema = z.object({
  access_token: z.string().min(1, 'Access token is required'),
  password: passwordSchema,
  confirm_password: z.string().min(1, 'Confirm password is required'),
}).refine((data) => data.password === data.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

// ── Update Profile ─────────────────────────────────────────────────────────

export const updateProfileSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must be 100 characters or fewer')
    .optional(),
  phone: z
    .string()
    .regex(/^\+[1-9]\d{1,14}$/, 'Phone must be in E.164 format')
    .nullable()
    .optional(),
  avatar_url: z.string().url('Invalid avatar URL').nullable().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
