// ─── Seller Validators ───────────────────────────────────────────────────────
// Zod schemas for all seller onboarding and profile endpoints.

import { z } from 'zod';

// Slug regex: lowercase letters, numbers, and hyphens (no trailing/leading hyphens)
const slugSchema = z
  .string()
  .min(3, 'Store slug must be at least 3 characters')
  .max(50, 'Store slug must be 50 characters or fewer')
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    'Slug must contain only lowercase letters, numbers, and single hyphens (e.g. my-store-99)'
  )
  .transform((v) => v.toLowerCase().trim());

const phoneField = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Phone must be in E.164 format (e.g. +919876543210 or 9876543210)');

// ── Onboarding Create Schema ───────────────────────────────────────────────

export const createSellerSchema = z.object({
  store_name: z
    .string()
    .trim()
    .min(3, 'Store name must be at least 3 characters')
    .max(100, 'Store name must be 100 characters or fewer'),
  store_slug: slugSchema,
  phone: phoneField,
  business_type: z
    .string()
    .trim()
    .min(2, 'Business type must be at least 2 characters')
    .max(50, 'Business type must be 50 characters or fewer'),
  profile_image: z.string().url('Invalid profile image URL').nullable().optional(),
  logo_url: z.string().url('Invalid logo image URL').nullable().optional(),
  banner_image: z.string().url('Invalid banner image URL').nullable().optional(),
  description: z
    .string()
    .trim()
    .max(1000, 'Description must be 1000 characters or fewer')
    .nullable()
    .optional(),
  social_links: z.record(z.string(), z.string()).optional(),
  categories: z.array(z.string()).optional(),
  policies: z.record(z.string(), z.string()).optional(),
  custom_theme: z.record(z.any()).optional(),
});

export type CreateSellerInput = z.infer<typeof createSellerSchema>;

// ── Profile Update Schema ───────────────────────────────────────────────────

export const updateSellerSchema = z.object({
  store_name: z
    .string()
    .trim()
    .min(3, 'Store name must be at least 3 characters')
    .max(100, 'Store name must be 100 characters or fewer')
    .optional(),
  store_slug: slugSchema.optional(),
  phone: phoneField.optional(),
  business_type: z
    .string()
    .trim()
    .min(2, 'Business type must be at least 2 characters')
    .max(50, 'Business type must be 50 characters or fewer')
    .optional(),
  profile_image: z.string().url('Invalid profile image URL').nullable().optional(),
  logo_url: z.string().url('Invalid logo image URL').nullable().optional(),
  banner_image: z.string().url('Invalid banner image URL').nullable().optional(),
  description: z
    .string()
    .trim()
    .max(1000, 'Description must be 1000 characters or fewer')
    .nullable()
    .optional(),
  social_links: z.record(z.string(), z.string()).optional(),
  categories: z.array(z.string()).optional(),
  policies: z.record(z.string(), z.string()).optional(),
  custom_theme: z.record(z.any()).optional(),
});

export type UpdateSellerInput = z.infer<typeof updateSellerSchema>;
