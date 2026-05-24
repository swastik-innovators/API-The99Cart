export type ProductType = 'digital' | 'physical';
export type ProductStatus = 'draft' | 'active' | 'hidden' | 'out_of_stock';

export interface Product {
  id: string;
  seller_id: string;
  store_id: string;
  title: string;
  slug: string;
  short_description?: string;
  description?: string;
  product_type: ProductType;
  price: number;
  sale_price?: number;
  currency: string;
  sku?: string;
  stock: number;
  thumbnail?: string;
  preview_images: string[];
  category_id?: string;
  subcategory_id?: string;
  tags: string[];
  status: ProductStatus;
  brand?: string;
  featured: boolean;
  seo_title?: string;
  seo_description?: string;
  seo_keywords: string[];
  average_rating: number;
  total_reviews: number;
  total_sales: number;
  views: number;
  created_at: string;
  updated_at: string;
  
  // Custom new fields
  variants?: any[];
  labels?: string[];
  gst?: number;
  faqs?: Array<{ question: string; answer: string }>;
  testimonials?: Array<{ name: string; comment: string; rating: number; date: string }>;
  digital_link?: string;
  demo_url?: string;
  file_size?: string;
  file_format?: string;
  key_features?: string[];
  bundle_products?: string[];
}

export interface ProductFile {
  id: string;
  product_id: string;
  file_name: string;
  file_url: string;
  file_type?: string;
  file_size?: number;
  storage_type: 'supabase' | 'cloudinary';
  created_at: string;
}

export interface CreateProductInput {
  title: string;
  short_description?: string;
  description?: string;
  product_type: ProductType;
  price: number;
  sale_price?: number;
  currency?: string;
  sku?: string;
  stock?: number;
  thumbnail?: string;
  preview_images?: string[];
  category_id?: string;
  subcategory_id?: string;
  tags?: string[];
  status?: ProductStatus;
  brand?: string;
  featured?: boolean;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string[];
  files?: Array<{
    file_name: string;
    file_url: string;
    file_type?: string;
    file_size?: number;
    storage_type?: 'supabase' | 'cloudinary';
  }>;
  
  // New fields
  variants?: any[];
  labels?: string[];
  gst?: number;
  faqs?: Array<{ question: string; answer: string }>;
  testimonials?: Array<{ name: string; comment: string; rating: number; date: string }>;
  digital_link?: string;
  demo_url?: string;
  file_size?: string;
  file_format?: string;
  key_features?: string[];
  bundle_products?: string[];
}

export interface UpdateProductInput extends Partial<Omit<CreateProductInput, 'files'>> {
  files?: Array<{
    id?: string;
    file_name: string;
    file_url: string;
    file_type?: string;
    file_size?: number;
    storage_type?: 'supabase' | 'cloudinary';
  }>;
}

export interface ProductFilters {
  search?: string;
  category_id?: string;
  subcategory_id?: string;
  min_price?: number;
  max_price?: number;
  status?: ProductStatus;
  featured?: boolean;
  product_type?: ProductType;
  sort_by?: 'newest' | 'price_asc' | 'price_desc' | 'popular' | 'best_selling';
  page?: number;
  limit?: number;
}

