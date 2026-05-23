-- ============================================================================
-- The99cart — Database Schema for Authentication
-- ============================================================================
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- This creates the profiles table, enum types, triggers, and RLS policies.
-- ============================================================================

-- ── 1. Custom Types ─────────────────────────────────────────────────────────

-- User roles
CREATE TYPE public.user_role AS ENUM ('customer', 'seller', 'admin');


-- ── 2. Profiles Table ───────────────────────────────────────────────────────

CREATE TABLE public.profiles (
  id                    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email                 TEXT NOT NULL UNIQUE,
  full_name             TEXT,
  phone                 TEXT,
  avatar_url            TEXT,
  role                  public.user_role NOT NULL DEFAULT 'customer',
  is_verified           BOOLEAN NOT NULL DEFAULT FALSE,
  onboarding_completed  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_role  ON public.profiles(role);


-- ── 3. Auto-Update updated_at ───────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_profiles_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();


-- ── 4. Auto-Create Profile on Signup ────────────────────────────────────────
-- When a user signs up via Supabase Auth, automatically create a profile row.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, is_verified)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    COALESCE((NEW.raw_user_meta_data->>'email_verified')::boolean, FALSE)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();


-- ── 5. Sync Email Verification Status ───────────────────────────────────────
-- When Supabase Auth confirms email, update profiles.is_verified.

CREATE OR REPLACE FUNCTION public.handle_user_updated()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
    UPDATE public.profiles
    SET is_verified = TRUE
    WHERE id = NEW.id;
  END IF;

  -- Sync email if changed
  IF OLD.email IS DISTINCT FROM NEW.email THEN
    UPDATE public.profiles
    SET email = NEW.email
    WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_updated();


-- ── 6. Row Level Security ───────────────────────────────────────────────────

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile (limited columns handled by API)
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admin can read all profiles (via service role key bypass)
-- No explicit policy needed — supabaseAdmin bypasses RLS

-- Service role can insert profiles (for trigger)
CREATE POLICY "Service role can insert profiles"
  ON public.profiles
  FOR INSERT
  WITH CHECK (true);


-- ── 7. Verify Setup ────────────────────────────────────────────────────────

-- Run this to verify the table was created:
-- SELECT * FROM public.profiles LIMIT 1;


-- ── 8. Sellers Table & Store System ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.sellers (
  id              UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  store_name      TEXT NOT NULL,
  store_slug      TEXT NOT NULL UNIQUE,
  phone           TEXT NOT NULL,
  business_type   TEXT NOT NULL,
  profile_image   TEXT,
  banner_image    TEXT,
  description     TEXT,
  social_links    JSONB NOT NULL DEFAULT '{}'::jsonb,
  categories      TEXT[] NOT NULL DEFAULT '{}'::text[],
  policies        JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for faster store slug lookups
CREATE INDEX IF NOT EXISTS idx_sellers_store_slug ON public.sellers(store_slug);

-- Trigger for updating updated_at on sellers table
CREATE TRIGGER on_sellers_updated
  BEFORE UPDATE ON public.sellers
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE public.sellers ENABLE ROW LEVEL SECURITY;

-- Setup RLS Policies for Sellers
CREATE POLICY "Sellers are viewable by everyone" 
  ON public.sellers FOR SELECT USING (true);

CREATE POLICY "Sellers can update their own profile" 
  ON public.sellers FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Sellers can insert their own profile" 
  ON public.sellers FOR INSERT WITH CHECK (auth.uid() = id);


-- ── 9. Products Table ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.products (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  store_id          UUID NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  title             TEXT NOT NULL,
  slug              TEXT NOT NULL UNIQUE,
  short_description TEXT,
  description       TEXT,
  product_type      TEXT NOT NULL CHECK (product_type IN ('digital', 'physical')),
  price             NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  sale_price        NUMERIC(12, 2),
  currency          TEXT NOT NULL DEFAULT 'USD',
  sku               TEXT,
  stock             INTEGER NOT NULL DEFAULT 0,
  thumbnail         TEXT,
  preview_images    TEXT[] NOT NULL DEFAULT '{}'::text[],
  category_id       TEXT,
  subcategory_id    TEXT,
  tags              TEXT[] NOT NULL DEFAULT '{}'::text[],
  status            TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'hidden', 'out_of_stock')),
  brand             TEXT,
  featured          BOOLEAN NOT NULL DEFAULT FALSE,
  seo_title         TEXT,
  seo_description   TEXT,
  seo_keywords      TEXT[] NOT NULL DEFAULT '{}'::text[],
  average_rating    NUMERIC(3, 2) NOT NULL DEFAULT 0.00,
  total_reviews     INTEGER NOT NULL DEFAULT 0,
  total_sales       INTEGER NOT NULL DEFAULT 0,
  views             INTEGER NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexing for fast dynamic marketplace lookups, sorting, and filters
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_seller_id ON public.products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_store_id ON public.products(store_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_products_price ON public.products(price);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_featured ON public.products(featured) WHERE featured = TRUE;

-- Attach auto-updated_at trigger
CREATE TRIGGER on_products_updated
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Setup RLS Policies for Products
CREATE POLICY "Products are viewable by everyone"
  ON public.products FOR SELECT USING (true);

CREATE POLICY "Sellers can manage their own products"
  ON public.products FOR ALL USING (auth.uid() = seller_id);


-- ── 10. Product Files Table (Digital Downloads) ───────────────────────────────

CREATE TABLE IF NOT EXISTS public.product_files (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id    UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  file_name     TEXT NOT NULL,
  file_url      TEXT NOT NULL,
  file_type     TEXT,
  file_size     BIGINT,
  storage_type  TEXT NOT NULL DEFAULT 'supabase' CHECK (storage_type IN ('supabase', 'cloudinary')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexing for downloads mapping
CREATE INDEX IF NOT EXISTS idx_product_files_product_id ON public.product_files(product_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.product_files ENABLE ROW LEVEL SECURITY;

-- Setup RLS Policies for Product Files
CREATE POLICY "Product files are viewable by everyone"
  ON public.product_files FOR SELECT USING (true);

CREATE POLICY "Sellers can manage their own product files"
  ON public.product_files FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_id AND p.seller_id = auth.uid()
    )
  );
