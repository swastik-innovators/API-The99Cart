import { z } from 'zod';

// ─── Base Product Object Schema ──────────────────────────────────────────────
// Defined as a standalone ZodObject to allow calling .partial() safely!
const baseProductSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200, 'Title cannot exceed 200 characters'),
  
  short_description: z.string().max(500, 'Short description cannot exceed 500 characters').optional(),
  
  description: z.string().optional(),
  
  product_type: z.enum(['digital', 'physical']),
  
  price: z.number().positive('Price must be greater than zero'),
  
  sale_price: z.number().positive('Sale price must be positive').optional(),
  
  currency: z.string().default('USD'),
  
  sku: z.string().max(100, 'SKU cannot exceed 100 characters').optional(),
  
  stock: z.number().int().nonnegative('Stock cannot be negative').default(0),
  
  thumbnail: z.string().url('Thumbnail must be a valid URL').optional().or(z.literal('')),
  
  preview_images: z.array(z.string().url('Preview image must be a valid URL')).default([]),
  
  category_id: z.string().optional(),
  
  subcategory_id: z.string().optional(),
  
  tags: z.array(z.string()).default([]),
  
  status: z.enum(['draft', 'active', 'hidden', 'out_of_stock']).default('draft'),
  
  brand: z.string().max(100).optional(),
  
  featured: z.boolean().default(false),
  
  seo_title: z.string().max(150).optional(),
  
  seo_description: z.string().max(250).optional(),
  
  seo_keywords: z.array(z.string()).default([]),
  
  files: z.array(z.object({
    file_name: z.string().min(1, 'File name is required'),
    file_url: z.string().url('File URL must be valid'),
    file_type: z.string().optional(),
    file_size: z.number().optional(),
    storage_type: z.enum(['supabase', 'cloudinary']).default('supabase'),
  })).optional(),
});

// ─── Create Product Schema (With Refinements) ────────────────────────────────
export const createProductSchema = baseProductSchema.refine(data => {
  if (data.sale_price && data.sale_price >= data.price) {
    return false;
  }
  return true;
}, {
  message: 'Sale price must be less than regular price',
  path: ['sale_price'],
});

// ─── Update Product Schema (With Partial & Refinements) ──────────────────────
export const updateProductSchema = baseProductSchema.partial().refine(data => {
  if (data.price !== undefined && data.sale_price !== undefined) {
    return data.sale_price < data.price;
  }
  return true;
}, {
  message: 'Sale price must be less than regular price',
  path: ['sale_price'],
});

// ─── Product Filters Schema ──────────────────────────────────────────────────
export const productFiltersSchema = z.object({
  search: z.string().optional(),
  category_id: z.string().optional(),
  subcategory_id: z.string().optional(),
  min_price: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  max_price: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  status: z.enum(['draft', 'active', 'hidden', 'out_of_stock']).optional(),
  featured: z.string().optional().transform(val => val === 'true' ? true : undefined),
  product_type: z.enum(['digital', 'physical']).optional(),
  sort_by: z.enum(['newest', 'price_asc', 'price_desc', 'popular', 'best_selling']).default('newest'),
  page: z.string().optional().default('1').transform(val => parseInt(val, 10)),
  limit: z.string().optional().default('10').transform(val => parseInt(val, 10)),
});
