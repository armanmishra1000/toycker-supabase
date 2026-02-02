-- =====================================================
-- Supabase Final Fix Migration - Phase 5
-- =====================================================
-- Purpose: Address remaining 22 issues from linter
-- - Enable RLS on global_settings
-- - Fix 3 functions with mutable search_path
-- - Ensure search_analytics policies exist
-- - Clean up remaining duplicate policies
-- =====================================================
-- Date: 2026-02-02
-- =====================================================

BEGIN;

-- =====================================================
-- FIX 1: Enable RLS on global_settings table
-- =====================================================
ALTER TABLE public.global_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for global_settings
DO $$
BEGIN
  -- Allow public read access
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'global_settings' 
    AND policyname = 'Public can read global settings'
  ) THEN
    EXECUTE 'CREATE POLICY "Public can read global settings"
      ON public.global_settings FOR SELECT
      TO public
      USING (true)';
  END IF;

  -- Admin-only write access
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'global_settings' 
    AND policyname = 'Admins can manage global settings'
  ) THEN
    EXECUTE 'CREATE POLICY "Admins can manage global settings"
      ON public.global_settings FOR ALL
      TO authenticated
      USING (public.is_admin())
      WITH CHECK (public.is_admin())';
  END IF;
END $$;

COMMENT ON TABLE public.global_settings IS 
  'Global application settings. RLS enabled - public read, admin write.';

-- =====================================================
-- FIX 2: Ensure search_analytics has correct policies
-- =====================================================
-- Drop any conflicting policies first
DROP POLICY IF EXISTS "Public can insert search_analytics" ON public.search_analytics;
DROP POLICY IF EXISTS "Public can insert searches" ON public.search_analytics;
DROP POLICY IF EXISTS "Admins can manage search_analytics" ON public.search_analytics;
DROP POLICY IF EXISTS "Admins read search analytics" ON public.search_analytics;

-- Create the correct policies
CREATE POLICY "Public can insert search_analytics"
  ON public.search_analytics FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Admins can manage search_analytics"
  ON public.search_analytics FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =====================================================
-- FIX 3: Fix function search_path issues
-- =====================================================
-- These functions were flagged as having mutable search_path
-- They may have been fixed in earlier migrations, but let's ensure

-- Function: update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog, pg_temp
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.update_updated_at_column() IS 
  'Trigger function to automatically update updated_at timestamp. Search path hardened.';

-- Function: create_order_with_payment  
-- Need to check if this exists first
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'create_order_with_payment'
  ) THEN
    -- Re-create with hardened search_path
    -- Note: We need to preserve the original function body
    -- This is a placeholder - the actual function should be recreated with its original logic
    EXECUTE 'ALTER FUNCTION public.create_order_with_payment SET search_path = public, pg_catalog, pg_temp';
  END IF;
END $$;

-- Function: track_search_rpc
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'track_search_rpc'
  ) THEN
    EXECUTE 'ALTER FUNCTION public.track_search_rpc SET search_path = public, pg_catalog, pg_temp';
  END IF;
END $$;

-- =====================================================
-- FIX 4: Clean up remaining duplicate policies
-- =====================================================
-- Based on the linter results showing multiple permissive policies

-- Collections: Remove old duplicate
DROP POLICY IF EXISTS "Admins can manage collections" ON public.collections;

-- Categories: Remove old duplicate  
DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;

-- Products: Remove old public read policy
DROP POLICY IF EXISTS "Allow public read access" ON public.products;

-- Product variants: Remove old policy
DROP POLICY IF EXISTS "Public read variants" ON public.product_variants;

-- Product options: Remove old duplicates
DROP POLICY IF EXISTS "Admins can manage product_options" ON public.product_options;

-- Product option values: Remove old duplicates
DROP POLICY IF EXISTS "Admins can manage product_option_values" ON public.product_option_values;

-- Product collections: Remove old duplicates
DROP POLICY IF EXISTS "Admins can manage product_collections" ON public.product_collections;

-- Product categories: Keep only consolidated policy
-- (Already handled in previous migration)

-- Home banners: Remove old policy
DROP POLICY IF EXISTS "Public can view active home banners" ON public.home_banners;
DROP POLICY IF EXISTS "Admins can manage home banners" ON public.home_banners;

-- Home exclusive collections: Remove old policy
DROP POLICY IF EXISTS "Public can view active exclusive collections" ON public.home_exclusive_collections;
DROP POLICY IF EXISTS "Admins can manage exclusive collections" ON public.home_exclusive_collections;

-- Shipping partners: Remove old duplicates
DROP POLICY IF EXISTS "Admins can manage shipping_partners" ON public.shipping_partners;

-- Reviews: Remove old policy
DROP POLICY IF EXISTS "Public can view approved reviews" ON public.reviews;

-- Profiles: Remove old policy
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Only users with customers:delete can delete customers" ON public.profiles;

-- Orders: Remove old policy
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;

-- Cart items: Remove old policies
DROP POLICY IF EXISTS "Access cart items via cart" ON public.cart_items;
DROP POLICY IF EXISTS "Admins can manage all cart items" ON public.cart_items;

-- Promotions: Ensure no duplicates
DROP POLICY IF EXISTS "Admins read all promotions" ON public.promotions;

-- Review media: Remove old policy
DROP POLICY IF EXISTS "Admins can manage review media" ON public.review_media;

-- Product combinations: Remove old policy
DROP POLICY IF EXISTS "Allow public read access for product combinations" ON public.product_combinations;

-- Payment providers: Ensure no conflicts
DROP POLICY IF EXISTS "Admins can manage payment_providers" ON public.payment_providers;

-- Shipping options: Ensure no conflicts
DROP POLICY IF EXISTS "Admins can manage shipping_options" ON public.shipping_options;

COMMIT;

-- =====================================================
-- POST-MIGRATION VERIFICATION
-- =====================================================
-- Run these queries to verify all fixes:
--
-- 1. Check RLS enabled on global_settings:
--    SELECT relname, relrowsecurity 
--    FROM pg_class 
--    WHERE relname = 'global_settings';
--    Expected: relrowsecurity = true
--
-- 2. Check function search_path settings:
--    SELECT p.proname, p.proconfig
--    FROM pg_proc p
--    JOIN pg_namespace n ON p.pronamespace = n.oid
--    WHERE n.nspname = 'public'
--    AND p.proname IN ('update_updated_at_column', 'create_order_with_payment', 'track_search_rpc');
--    Expected: All should have search_path in proconfig
--
-- 3. Check remaining multiple policies:
--    SELECT schemaname, tablename, COUNT(*) as policy_count
--    FROM pg_policies
--    WHERE schemaname = 'public'
--    GROUP BY schemaname, tablename
--    HAVING COUNT(*) > 3
--    ORDER BY policy_count DESC;
--    Expected: Should see very few tables with multiple policies
--
-- 4. Run Supabase linter again:
--    Should show significantly fewer issues (target: <10)
-- =====================================================
