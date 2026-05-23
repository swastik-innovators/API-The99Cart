// ─── Common Validators ─────────────────────────────────────────────────────
// Reusable Zod schemas for common validation patterns.

import { z } from 'zod';

/** UUID v4 validation */
export const uuidSchema = z.string().uuid('Invalid UUID format');

/** Pagination query params */
export const paginationSchema = z.object({
  page: z
    .string()
    .optional()
    .default('1')
    .transform(Number)
    .pipe(z.number().int().min(1, 'Page must be at least 1')),
  limit: z
    .string()
    .optional()
    .default('20')
    .transform(Number)
    .pipe(z.number().int().min(1).max(100, 'Limit cannot exceed 100')),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

/** ID param */
export const idParamSchema = z.object({
  id: uuidSchema,
});

/** Email validation */
export const emailSchema = z
  .string()
  .email('Invalid email format')
  .max(255, 'Email must be 255 characters or fewer')
  .transform((v) => v.toLowerCase().trim());

/** Phone number validation (E.164 format) */
export const phoneSchema = z
  .string()
  .regex(/^\+[1-9]\d{1,14}$/, 'Phone must be in E.164 format (e.g. +919876543210)');

/** Non-empty trimmed string */
export const nonEmptyString = (field: string, maxLen = 255) =>
  z
    .string()
    .trim()
    .min(1, `${field} is required`)
    .max(maxLen, `${field} must be ${maxLen} characters or fewer`);

/** Price (positive number with 2 decimal places max) */
export const priceSchema = z
  .number()
  .positive('Price must be positive')
  .multipleOf(0.01, 'Price can have at most 2 decimal places');
