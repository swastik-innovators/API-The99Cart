// ─── Seller Types ────────────────────────────────────────────────────────────
// Types specific to the seller profile and onboarding module.

export interface SellerProfile {
  id: string;
  store_name: string;
  store_slug: string;
  phone: string;
  business_type: string;
  profile_image: string | null;
  logo_url: string | null;
  banner_image: string | null;
  description: string | null;
  social_links: Record<string, string>;
  categories: string[];
  policies: Record<string, string>;
  custom_theme: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CreateSellerInput {
  store_name: string;
  store_slug: string;
  phone: string;
  business_type: string;
  profile_image?: string | null;
  logo_url?: string | null;
  banner_image?: string | null;
  description?: string | null;
  social_links?: Record<string, string>;
  categories?: string[];
  policies?: Record<string, string>;
  custom_theme?: Record<string, any>;
}

export interface UpdateSellerInput {
  store_name?: string;
  store_slug?: string;
  phone?: string;
  business_type?: string;
  profile_image?: string | null;
  logo_url?: string | null;
  banner_image?: string | null;
  description?: string | null;
  social_links?: Record<string, string>;
  categories?: string[];
  policies?: Record<string, string>;
  custom_theme?: Record<string, any>;
}
