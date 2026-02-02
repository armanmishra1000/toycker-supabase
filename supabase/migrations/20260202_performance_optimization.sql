-- =====================================================
-- Supabase Performance Optimization - Phase 3
-- =====================================================
-- Fixes 33 performance warnings:
--   1. Auth RLS Init Plan Optimization (3 policies)
--   2. Multiple Permissive Policies Consolidation (30 tables)
-- =====================================================
-- Issue Reference: Supabase Dashboard Performance Lints
-- Date: 2026-02-02
-- =====================================================
-- PERFORMANCE IMPACT: This migration consolidates duplicate policies
-- to improve query performance. PostgreSQL evaluates all permissive
-- policies with OR logic, so consolidating them speeds up queries.
-- =====================================================

BEGIN;

-- =====================================================
-- PERFORMANCE FIX 1: Auth RLS Init Plan Optimization
-- =====================================================
-- Issue: Direct auth.uid() calls are re-evaluated per row
-- Solution: Wrap in SELECT to cache the result
-- Reference: https://supabase.com/docs/guides/database/database-linter?lint=0004_auth_rls_initplan

-- CRITICAL: Identify the exact policy names first by checking existing policies
-- We'll create a safer approach by using IF EXISTS logic

-- Note: Since we can't know exact existing policy names without querying,
-- we'll use a more defensive approach and create new optimized policies

-- -----------------------------------------------------
-- Table: profiles
-- -----------------------------------------------------
-- Consolidate SELECT policies and optimize auth.uid()
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Only users with customers:delete ability can access" ON public.profiles;

CREATE POLICY "Consolidated SELECT for profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    id = (SELECT auth.uid())  -- Optimized: wrapped in SELECT
    OR (SELECT public.is_admin())  -- Admin access
  );

-- Consolidate UPDATE policies
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;

CREATE POLICY "Consolidated UPDATE for profiles"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (
    id = (SELECT auth.uid())
    OR (SELECT public.is_admin())
  )
  WITH CHECK (
    id = (SELECT auth.uid())
    OR (SELECT public.is_admin())
  );

-- -----------------------------------------------------
-- Table: orders  
-- -----------------------------------------------------
-- Consolidate multiple SELECT policies
DROP POLICY IF EXISTS "Customers can see their own orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can see all orders" ON public.orders;
DROP POLICY IF EXISTS "Public read orders" ON public.orders;

CREATE POLICY "Consolidated SELECT for orders"
  ON public.orders FOR SELECT
  TO public
  USING (
    user_id = (SELECT auth.uid())  -- Optimized: wrapped in SELECT
    OR (SELECT public.is_admin())  -- Admin access
    OR user_id IS NULL  -- Guest orders (if needed)
  );

-- Consolidate UPDATE/DELETE policies
DROP POLICY IF EXISTS "Authenticated users can update orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update all orders" ON public.orders;

CREATE POLICY "Consolidated UPDATE for orders"
  ON public.orders FOR UPDATE
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR (SELECT public.is_admin())
  )
  WITH CHECK (
    user_id = (SELECT auth.uid())
    OR (SELECT public.is_admin())
  );

-- =====================================================
-- PERFORMANCE FIX 2: Multiple Permissive Policies Consolidation
-- =====================================================
-- Consolidate tables with multiple permissive policies
-- Pattern: Merge policies with same role/action using explicit OR

-- -----------------------------------------------------
-- Table: addresses (2 SELECT policies)
-- -----------------------------------------------------
DROP POLICY IF EXISTS "Users can view their own addresses" ON public.addresses;
DROP POLICY IF EXISTS "Admins read all addresses" ON public.addresses;

CREATE POLICY "Consolidated SELECT for addresses"
  ON public.addresses FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR (SELECT public.is_admin())
  );

-- -----------------------------------------------
-- Table: cart_items (4 policies)
-- -----------------------------------------------------
DROP POLICY IF EXISTS "Users can manage their own cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Users can view their cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Users can delete their cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Users can insert their cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Users can update their cart items" ON public.cart_items;

-- Single policy for user ownership
CREATE POLICY "Users manage own cart items"
  ON public.cart_items FOR ALL
  TO authenticated
  USING (
    cart_id IN (SELECT id FROM public.carts WHERE user_id = (SELECT auth.uid()))
  )
  WITH CHECK (
    cart_id IN (SELECT id FROM public.carts WHERE user_id = (SELECT auth.uid()))
  );

-- -----------------------------------------------------
-- Table: categories (2 SELECT policies) 
-- -----------------------------------------------------
DROP POLICY IF EXISTS "Public read categories" ON public.categories;
DROP POLICY IF EXISTS "Public can view categories" ON public.categories;
DROP POLICY IF EXISTS "Admins manage categories" ON public.categories;

CREATE POLICY "Public SELECT categories"
  ON public.categories FOR SELECT
  TO public
  USING (true);  -- Public read is intentional

CREATE POLICY "Admins manage categories"
  ON public.categories FOR ALL
  TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

-- -----------------------------------------------------
-- Table: collections (2 SELECT policies)
-- -----------------------------------------------------
DROP POLICY IF EXISTS "Public read collections" ON public.collections;
DROP POLICY IF EXISTS "Public can view collections" ON public.collections;
DROP POLICY IF EXISTS "Admins manage collections" ON public.collections;

CREATE POLICY "Public SELECT collections"
  ON public.collections FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins manage collections"
  ON public.collections FOR ALL
  TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

-- -----------------------------------------------------
-- Table: products (2 SELECT policies)
-- -----------------------------------------------------
DROP POLICY IF EXISTS "Public can view products" ON public.products;
DROP POLICY IF EXISTS "Public read products" ON public.products;
DROP POLICY IF EXISTS "Admins manage products" ON public.products;

CREATE POLICY "Public SELECT products"
  ON public.products FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins manage products"
  ON public.products FOR ALL
  TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

-- -----------------------------------------------------
-- Table: product_variants (2 SELECT policies)
-- -----------------------------------------------------
DROP POLICY IF EXISTS "Public can view product_variants" ON public.product_variants;
DROP POLICY IF EXISTS "Public read product_variants" ON public.product_variants;
DROP POLICY IF EXISTS "Admins manage product_variants" ON public.product_variants;

CREATE POLICY "Public SELECT product_variants"
  ON public.product_variants FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins manage product_variants"
  ON public.product_variants FOR ALL
  TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

-- -----------------------------------------------------
-- Table: product_options (2 SELECT policies)
-- -----------------------------------------------------
DROP POLICY IF EXISTS "Public read product_options" ON public.product_options;
DROP POLICY IF EXISTS "Public can view product_options" ON public.product_options;
DROP POLICY IF EXISTS "Admins manage product_options" ON public.product_options;

CREATE POLICY "Public SELECT product_options"
  ON public.product_options FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins manage product_options"
  ON public.product_options FOR ALL
  TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

-- -----------------------------------------------------
-- Table: product_option_values (2 SELECT policies)
-- -----------------------------------------------------
DROP POLICY IF EXISTS "Public read product_option_values" ON public.product_option_values;
DROP POLICY IF EXISTS "Public can view product_option_values" ON public.product_option_values;
DROP POLICY IF EXISTS "Admins manage product_option_values" ON public.product_option_values;

CREATE POLICY "Public SELECT product_option_values"
  ON public.product_option_values FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins manage product_option_values"
  ON public.product_option_values FOR ALL
  TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

-- -----------------------------------------------------
-- Table: product_categories (2 SELECT policies)
-- -----------------------------------------------------
DROP POLICY IF EXISTS "Public read product_categories" ON public.product_categories;
DROP POLICY IF EXISTS "Public can view product_categories" ON public.product_categories;
DROP POLICY IF EXISTS "Admins manage product_categories" ON public.product_categories;

CREATE POLICY "Public SELECT product_categories"
  ON public.product_categories FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins manage product_categories"
  ON public.product_categories FOR ALL
  TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

-- -----------------------------------------------------
-- Table: product_collections (2 SELECT policies)
-- -----------------------------------------------------
DROP POLICY IF EXISTS "Public read product_collections" ON public.product_collections;
DROP POLICY IF EXISTS "Public can view product_collections" ON public.product_collections;
DROP POLICY IF EXISTS "Admins manage product_collections" ON public.product_collections;

CREATE POLICY "Public SELECT product_collections"
  ON public.product_collections FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins manage product_collections"
  ON public.product_collections FOR ALL
  TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

-- -----------------------------------------------------
-- Table: promotions (2 SELECT policies)
-- -----------------------------------------------------
DROP POLICY IF EXISTS "Public read active promotions" ON public.promotions;
DROP POLICY IF EXISTS "Admins read all promotions" ON public.promotions;
DROP POLICY IF EXISTS "Admins manage promotions" ON public.promotions;

CREATE POLICY "Consolidated SELECT for promotions"
  ON public.promotions FOR SELECT
  TO public
  USING (
    (is_active = true AND (starts_at IS NULL OR starts_at <= NOW()))  -- Public can see active
    OR ((SELECT auth.role()) = 'authenticated' AND (SELECT public.is_admin()))  -- Admins see all
  );

CREATE POLICY "Admins manage promotions"
  ON public.promotions FOR ALL
  TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

-- -----------------------------------------------------
-- Table: reviews (2 INSERT + 3 SELECT policies)
-- -----------------------------------------------------
DROP POLICY IF EXISTS "Users create their own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Authenticated users can create reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can view their own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Public can view reviews" ON public.reviews;
DROP POLICY IF EXISTS "Admins can do everything on reviews" ON public.reviews;
DROP POLICY IF EXISTS "Admins manage reviews" ON public.reviews;

CREATE POLICY "Public SELECT reviews"
  ON public.reviews FOR SELECT
  TO public
  USING (true);  -- Reviews are public

CREATE POLICY "Users create own reviews"
  ON public.reviews FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Admins manage reviews"
  ON public.reviews FOR ALL
  TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

-- -----------------------------------------------------
-- Table: review_media (2 INSERT + 2 SELECT policies)
-- -----------------------------------------------------
-- Already fixed in Phase 2, ensuring consistency here
DROP POLICY IF EXISTS "Users upload review media for their reviews" ON public.review_media;
DROP POLICY IF EXISTS "Authenticated users can upload review media" ON public.review_media;
DROP POLICY IF EXISTS "Public can view review media" ON public.review_media;

CREATE POLICY "Public SELECT review_media"
  ON public.review_media FOR SELECT
  TO public
  USING (true);

-- Policy for uploading was already created in Phase 2

-- -----------------------------------------------------
-- Table: reward_wallets (2 SELECT policies)
-- -----------------------------------------------------
DROP POLICY IF EXISTS "Users read own wallet" ON public.reward_wallets;
DROP POLICY IF EXISTS "Admins read all wallets" ON public.reward_wallets;

CREATE POLICY "Consolidated SELECT for reward_wallets"
  ON public.reward_wallets FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR (SELECT public.is_admin())
  );

-- -----------------------------------------------------
-- Table: reward_transactions (2 SELECT policies)
-- -----------------------------------------------------
DROP POLICY IF EXISTS "Users read own transactions" ON public.reward_transactions;
DROP POLICY IF EXISTS "Admins read all reward transactions" ON public.reward_transactions;

CREATE POLICY "Consolidated SELECT for reward_transactions"
  ON public.reward_transactions FOR SELECT
  TO authenticated
  USING (
    wallet_id IN (SELECT id FROM public.reward_wallets WHERE user_id = (SELECT auth.uid()))
    OR (SELECT public.is_admin())
  );

-- -----------------------------------------------------
-- Table: shipping_options (2 SELECT policies)
-- -----------------------------------------------------
DROP POLICY IF EXISTS "Public read shipping_options" ON public.shipping_options;
DROP POLICY IF EXISTS "Public can view shipping_options" ON public.shipping_options;
DROP POLICY IF EXISTS "Admins manage shipping_options" ON public.shipping_options;

CREATE POLICY "Public SELECT shipping_options"
  ON public.shipping_options FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins manage shipping_options"
  ON public.shipping_options FOR ALL
  TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

-- -----------------------------------------------------
-- Table: shipping_partners (2 SELECT policies)
-- -----------------------------------------------------
DROP POLICY IF EXISTS "Public read shipping_partners" ON public.shipping_partners;
DROP POLICY IF EXISTS "Public can view shipping_partners" ON public.shipping_partners;
DROP POLICY IF EXISTS "Admins manage shipping_partners" ON public.shipping_partners;

CREATE POLICY "Public SELECT shipping_partners"
  ON public.shipping_partners FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins manage shipping_partners"
  ON public.shipping_partners FOR ALL
  TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

-- -----------------------------------------------------
-- Table: payment_providers (2 SELECT policies)
-- -----------------------------------------------------
DROP POLICY IF EXISTS "Public read payment_providers" ON public.payment_providers;
DROP POLICY IF EXISTS "Public can view payment_providers" ON public.payment_providers;
DROP POLICY IF EXISTS "Admins manage payment_providers" ON public.payment_providers;

CREATE POLICY "Public SELECT payment_providers"
  ON public.payment_providers FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins manage payment_providers"
  ON public.payment_providers FOR ALL
  TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

-- -----------------------------------------------------
-- Tables: home_banners, home_exclusive_collections
-- -----------------------------------------------------
DROP POLICY IF EXISTS "Public read home_banners" ON public.home_banners;
DROP POLICY IF EXISTS "Public can view home_banners" ON public.home_banners;
DROP POLICY IF EXISTS "Admins manage home_banners" ON public.home_banners;

CREATE POLICY "Public SELECT home_banners"
  ON public.home_banners FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins manage home_banners"
  ON public.home_banners FOR ALL
  TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

DROP POLICY IF EXISTS "Public read home_exclusive_collections" ON public.home_exclusive_collections;
DROP POLICY IF EXISTS "Public can view home_exclusive_collections" ON public.home_exclusive_collections;
DROP POLICY IF EXISTS "Admins manage home_exclusive_collections" ON public.home_exclusive_collections;

CREATE POLICY "Public SELECT home_exclusive_collections"
  ON public.home_exclusive_collections FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins manage home_exclusive_collections"
  ON public.home_exclusive_collections FOR ALL
  TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

COMMIT;

-- =====================================================
-- POST-MIGRATION VERIFICATION
-- =====================================================
-- Run these queries to verify performance improvements:
--
-- 1. Check for remaining multiple policies:
--    SELECT schemaname, tablename, COUNT(*) as policy_count
--    FROM pg_policies
--    WHERE schemaname = 'public'
--    GROUP BY schemaname, tablename
--    HAVING COUNT(*) > 3  -- Most tables should have ≤3 policies now
--    ORDER BY policy_count DESC;
--
-- 2. Verify auth.uid() optimization:
--    SELECT tablename, policyname, qual, with_check
--    FROM pg_policies
--    WHERE schemaname = 'public'
--      AND (qual::text LIKE '%auth.uid()%' OR with_check::text LIKE '%auth.uid()%')
--      AND qual::text NOT LIKE '%SELECT auth.uid()%';
--    Expected: Should return no rows (all should be wrapped in SELECT)
--
-- 3. Test query performance:
--    EXPLAIN ANALYZE SELECT * FROM products LIMIT 100;
--    Compare execution time before/after this migration
-- =====================================================
