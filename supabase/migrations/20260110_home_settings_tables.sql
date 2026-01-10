-- Home Settings Tables Migration
-- Creates tables for managing homepage banners and exclusive collections

-- =============================================
-- Table: home_banners
-- Purpose: Store hero banner configurations for homepage
-- =============================================
CREATE TABLE IF NOT EXISTS public.home_banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  image_url TEXT NOT NULL,
  alt_text TEXT,
  link_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_home_banners_active_sort 
  ON public.home_banners(is_active, sort_order) 
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_home_banners_schedule 
  ON public.home_banners(starts_at, ends_at) 
  WHERE is_active = true;

-- =============================================
-- Table: home_exclusive_collections
-- Purpose: Store exclusive collection entries (videos + products)
-- =============================================
CREATE TABLE IF NOT EXISTS public.home_exclusive_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  video_url TEXT NOT NULL,
  poster_url TEXT,
  video_duration INTEGER, -- in seconds
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE(product_id) -- One collection entry per product
);

-- Index for efficient querying
CREATE INDEX IF NOT EXISTS idx_exclusive_collections_active_sort 
  ON public.home_exclusive_collections(is_active, sort_order) 
  WHERE is_active = true;

-- =============================================
-- Enable Row Level Security
-- =============================================
ALTER TABLE public.home_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.home_exclusive_collections ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS Policies: home_banners
-- =============================================

-- Public can view active, scheduled banners
DROP POLICY IF EXISTS "Public can view active home banners" ON public.home_banners;
CREATE POLICY "Public can view active home banners" ON public.home_banners
  FOR SELECT
  TO public
  USING (
    is_active = true AND
    (starts_at IS NULL OR starts_at <= now()) AND
    (ends_at IS NULL OR ends_at > now())
  );

-- Admins have full access
DROP POLICY IF EXISTS "Admins can manage home banners" ON public.home_banners;
CREATE POLICY "Admins can manage home banners" ON public.home_banners
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- =============================================
-- RLS Policies: home_exclusive_collections
-- =============================================

-- Public can view active collections
DROP POLICY IF EXISTS "Public can view active exclusive collections" ON public.home_exclusive_collections;
CREATE POLICY "Public can view active exclusive collections" ON public.home_exclusive_collections
  FOR SELECT
  TO public
  USING (is_active = true);

-- Admins have full access
DROP POLICY IF EXISTS "Admins can manage exclusive collections" ON public.home_exclusive_collections;
CREATE POLICY "Admins can manage exclusive collections" ON public.home_exclusive_collections
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- =============================================
-- Trigger: Update updated_at timestamp
-- =============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Apply trigger to home_banners
DROP TRIGGER IF EXISTS update_home_banners_updated_at ON public.home_banners;
CREATE TRIGGER update_home_banners_updated_at
  BEFORE UPDATE ON public.home_banners
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Apply trigger to home_exclusive_collections
DROP TRIGGER IF EXISTS update_home_exclusive_collections_updated_at ON public.home_exclusive_collections;
CREATE TRIGGER update_home_exclusive_collections_updated_at
  BEFORE UPDATE ON public.home_exclusive_collections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
