-- =====================================================
-- Supabase Policy Cleanup - Phase 4
-- =====================================================
-- Purpose: Remove duplicate/old policies that were not properly
-- dropped in Phase 3 due to naming mismatches
-- =====================================================
-- Date: 2026-02-02
-- =====================================================

BEGIN;

-- Clean up duplicate admin policies (old naming convention)
DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
DROP POLICY IF EXISTS "Public can view categories" ON public.categories;

DROP POLICY IF EXISTS "Admins can manage collections" ON public.collections;
DROP POLICY IF EXISTS "Public can view collections" ON public.collections;

DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
DROP POLICY IF EXISTS "Allow public read access" ON public.products;

DROP POLICY IF EXISTS "Admins can manage product_variants" ON public.product_variants;
DROP POLICY IF EXISTS "Public read variants" ON public.product_variants;

DROP POLICY IF EXISTS "Admins can manage product_options" ON public.product_options;

DROP POLICY IF EXISTS "Admins can manage product_option_values" ON public.product_option_values;

DROP POLICY IF EXISTS "Admins can manage product_collections" ON public.product_collections;

DROP POLICY IF EXISTS "Admins can manage home banners" ON public.home_banners;
DROP POLICY IF EXISTS "Public can view active home banners" ON public.home_banners;

DROP POLICY IF EXISTS "Admins can manage exclusive collections" ON public.home_exclusive_collections;
DROP POLICY IF EXISTS "Public can view active exclusive collections" ON public.home_exclusive_collections;

DROP POLICY IF EXISTS "Admins can manage shipping_partners" ON public.shipping_partners;

-- Clean up profiles duplicate policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Only users with customers:delete can delete customers" ON public.profiles;

-- Clean up orders duplicate policy
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;

-- Clean up cart_items old policies
DROP POLICY IF EXISTS "Access cart items via cart" ON public.cart_items;
DROP POLICY IF EXISTS "Admins can manage all cart items" ON public.cart_items;

--Clean up reviews duplicate policies
DROP POLICY IF EXISTS "Public can view approved reviews" ON public.reviews;

-- Clean up review_media duplicate policy
DROP POLICY IF EXISTS "Admins can manage review media" ON public.review_media;

-- Clean up product_combinations old policy
DROP POLICY IF EXISTS "Allow public read access for product combinations" ON public.product_combinations;

COMMIT;

-- =====================================================
-- POST-CLEANUP VERIFICATION
-- =====================================================
-- Run this query to verify cleanup success:
--
-- SELECT schemaname, tablename, COUNT(*) as policy_count,
--        array_agg(policyname) as policies
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- GROUP BY schemaname, tablename
-- HAVING COUNT(*) > 3
-- ORDER BY policy_count DESC;
--
-- Expected: Should now see FAR fewer tables with multiple policies
-- =====================================================
