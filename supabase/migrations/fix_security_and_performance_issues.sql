-- =====================================================
-- Supabase Security and Performance Fixes
-- =====================================================
-- 
-- This migration fixes 93 security and performance issues
-- Run this in Supabase SQL Editor
--
-- IMPORTANT: Review the implementation plan before running
-- =====================================================

BEGIN;

-- =====================================================
-- PHASE 1: SECURITY FIXES
-- =====================================================

-- -----------------------------------------------------
-- 1. Enable RLS on product_categories table
-- -----------------------------------------------------

-- Enable RLS if not already enabled
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public read product_categories" ON public.product_categories;
DROP POLICY IF EXISTS "Admins manage product_categories" ON public.product_categories;

-- Add public read policy
CREATE POLICY "Public read product_categories"
  ON public.product_categories FOR SELECT
  TO public
  USING (true);

-- Add admin management policy
CREATE POLICY "Admins manage product_categories"
  ON public.product_categories FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 2. Fix function search_path vulnerabilities (3 functions)
-- -----------------------------------------------------

-- Note: match_products removed (image search feature deleted)

-- Fix: handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''  -- Empty for maximum security
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$;

-- Fix: handle_admin_notification
CREATE OR REPLACE FUNCTION public.handle_admin_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''  -- Empty for maximum security
AS $$
BEGIN
  INSERT INTO public.admin_notifications (
    type,
    title,
    message,
    created_at
  )
  VALUES (
    TG_ARGV[0],
    TG_ARGV[1],
    NEW.id::text,
    NOW()
  );
  RETURN NEW;
END;
$$;

-- Fix: is_admin (keep existing logic, just fix search_path)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''  -- Empty for maximum security
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.admin_roles
    WHERE user_id = auth.uid()
      AND is_active = true
  );
END;
$$;

-- -----------------------------------------------------
-- 3. Vector extension logic removed (image search feature deleted)
-- -----------------------------------------------------

-- -----------------------------------------------------
-- 4. Consolidate and secure overly permissive RLS policies
-- -----------------------------------------------------

-- Products table: Consolidate 6 policies into 2
DROP POLICY IF EXISTS "Admin delete products" ON public.products;
DROP POLICY IF EXISTS "Admin insert products" ON public.products;
DROP POLICY IF EXISTS "Admin update products" ON public.products;
DROP POLICY IF EXISTS "Admins can delete products" ON public.products;
DROP POLICY IF EXISTS "Admins can insert products" ON public.products;
DROP POLICY IF EXISTS "Admins can update products" ON public.products;
DROP POLICY IF EXISTS "Allow authenticated delete products" ON public.products;
DROP POLICY IF EXISTS "Allow authenticated insert products" ON public.products;
DROP POLICY IF EXISTS "Allow authenticated update products" ON public.products;
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;

CREATE POLICY "Admins can manage products"
  ON public.products FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Categories table: Consolidate policies
DROP POLICY IF EXISTS "Allow authenticated delete categories" ON public.categories;
DROP POLICY IF EXISTS "Allow authenticated insert categories" ON public.categories;
DROP POLICY IF EXISTS "Allow authenticated update categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;

CREATE POLICY "Admins can manage categories"
  ON public.categories FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Collections table: Consolidate policies
DROP POLICY IF EXISTS "Allow authenticated delete collections" ON public.collections;
DROP POLICY IF EXISTS "Allow authenticated insert collections" ON public.collections;
DROP POLICY IF EXISTS "Allow authenticated update collections" ON public.collections;
DROP POLICY IF EXISTS "Admins can manage collections" ON public.collections;

CREATE POLICY "Admins can manage collections"
  ON public.collections FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Product variants table: Consolidate policies
DROP POLICY IF EXISTS "Allow authenticated delete variants" ON public.product_variants;
DROP POLICY IF EXISTS "Allow authenticated insert variants" ON public.product_variants;
DROP POLICY IF EXISTS "Allow authenticated update variants" ON public.product_variants;
DROP POLICY IF EXISTS "Admins can manage product_variants" ON public.product_variants;

CREATE POLICY "Admins can manage product_variants"
  ON public.product_variants FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Product options table: Consolidate policies
DROP POLICY IF EXISTS "Allow authenticated users to delete product options" ON public.product_options;
DROP POLICY IF EXISTS "Allow authenticated users to insert product options" ON public.product_options;
DROP POLICY IF EXISTS "Allow authenticated users to update product options" ON public.product_options;
DROP POLICY IF EXISTS "Admins can manage product_options" ON public.product_options;

CREATE POLICY "Admins can manage product_options"
  ON public.product_options FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Product option values table: Consolidate policies
DROP POLICY IF EXISTS "Allow authenticated users to delete product option values" ON public.product_option_values;
DROP POLICY IF EXISTS "Allow authenticated users to insert product option values" ON public.product_option_values;
DROP POLICY IF EXISTS "Allow authenticated users to update product option values" ON public.product_option_values;
DROP POLICY IF EXISTS "Admins can manage product_option_values" ON public.product_option_values;

CREATE POLICY "Admins can manage product_option_values"
  ON public.product_option_values FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Shipping partners table: Consolidate policies
DROP POLICY IF EXISTS "Admin delete shipping_partners" ON public.shipping_partners;
DROP POLICY IF EXISTS "Admin write shipping_partners" ON public.shipping_partners;
DROP POLICY IF EXISTS "Admins can manage shipping_partners" ON public.shipping_partners;

CREATE POLICY "Admins can manage shipping_partners"
  ON public.shipping_partners FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Club settings table: Fix policy
DROP POLICY IF EXISTS "Authenticated update club settings" ON public.club_settings;
DROP POLICY IF EXISTS "Admins can update club_settings" ON public.club_settings;

CREATE POLICY "Admins can update club_settings"
  ON public.club_settings FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Product collections table: Fix admin policy
DROP POLICY IF EXISTS "Admin manage product_collections" ON public.product_collections;
DROP POLICY IF EXISTS "Admins can manage product_collections" ON public.product_collections;

CREATE POLICY "Admins can manage product_collections"
  ON public.product_collections FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Order timeline table: Fix policy
DROP POLICY IF EXISTS "Admin write order_timeline" ON public.order_timeline;
DROP POLICY IF EXISTS "Admins can write order_timeline" ON public.order_timeline;

CREATE POLICY "Admins can write order_timeline"
  ON public.order_timeline FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- Orders table: Fix public create policy
DROP POLICY IF EXISTS "Public create orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated users can create orders" ON public.orders;

CREATE POLICY "Authenticated users can create orders"
  ON public.orders FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Reviews table: Keep simple for authenticated users
DROP POLICY IF EXISTS "Authenticated users can create reviews" ON public.reviews;

CREATE POLICY "Authenticated users can create reviews"
  ON public.reviews FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Review media table: Keep simple for authenticated users
DROP POLICY IF EXISTS "Authenticated users can upload review media" ON public.review_media;

CREATE POLICY "Authenticated users can upload review media"
  ON public.review_media FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- NOTE: cart_items and carts policies kept as USING(true) for basic prototype
-- TODO before production: implement session-based cart security

COMMIT;

-- =====================================================
-- PHASE 2: PERFORMANCE FIXES
-- =====================================================

BEGIN;

-- -----------------------------------------------------
-- 5. Optimize RLS policies with auth.uid() subqueries
-- -----------------------------------------------------

-- Profiles table: 4 policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
CREATE POLICY "Admins can read all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Addresses table: 4 policies
DROP POLICY IF EXISTS "Users can view their own addresses" ON public.addresses;
CREATE POLICY "Users can view their own addresses"
  ON public.addresses FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can insert their own addresses" ON public.addresses;
CREATE POLICY "Users can insert their own addresses"
  ON public.addresses FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update their own addresses" ON public.addresses;
CREATE POLICY "Users can update their own addresses"
  ON public.addresses FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can delete their own addresses" ON public.addresses;
CREATE POLICY "Users can delete their own addresses"
  ON public.addresses FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- Reviews table: 2 policies
DROP POLICY IF EXISTS "Users can view their own reviews" ON public.reviews;
CREATE POLICY "Users can view their own reviews"
  ON public.reviews FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Admins can do everything on reviews" ON public.reviews;
CREATE POLICY "Admins can do everything on reviews"
  ON public.reviews FOR ALL
  TO authenticated
  USING (public.is_admin());

-- Review media table: 1 policy
DROP POLICY IF EXISTS "Admins can manage review media" ON public.review_media;
CREATE POLICY "Admins can manage review media"
  ON public.review_media FOR ALL
  TO authenticated
  USING (public.is_admin());

-- Wishlist items table: 1 policy
DROP POLICY IF EXISTS "Users can manage their own wishlist items" ON public.wishlist_items;
CREATE POLICY "Users can manage their own wishlist items"
  ON public.wishlist_items FOR ALL
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- Reward wallets table: 3 policies
DROP POLICY IF EXISTS "Users read own wallet" ON public.reward_wallets;
CREATE POLICY "Users read own wallet"
  ON public.reward_wallets FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can create own wallet" ON public.reward_wallets;
CREATE POLICY "Users can create own wallet"
  ON public.reward_wallets FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update own wallet" ON public.reward_wallets;
CREATE POLICY "Users can update own wallet"
  ON public.reward_wallets FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- Reward transactions table: 2 policies
DROP POLICY IF EXISTS "Users read own transactions" ON public.reward_transactions;
CREATE POLICY "Users read own transactions"
  ON public.reward_transactions FOR SELECT
  TO authenticated
  USING (wallet_id IN (SELECT id FROM public.reward_wallets WHERE user_id = (SELECT auth.uid())));

DROP POLICY IF EXISTS "Users can create own transactions" ON public.reward_transactions;
CREATE POLICY "Users can create own transactions"
  ON public.reward_transactions FOR INSERT
  TO authenticated
  WITH CHECK (wallet_id IN (SELECT id FROM public.reward_wallets WHERE user_id = (SELECT auth.uid())));

-- Admin notifications table: 2 policies
DROP POLICY IF EXISTS "Admins can view notifications" ON public.admin_notifications;
CREATE POLICY "Admins can view notifications"
  ON public.admin_notifications FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update notifications" ON public.admin_notifications;
CREATE POLICY "Admins can update notifications"
  ON public.admin_notifications FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- -----------------------------------------------------
-- 6. Consolidate duplicate permissive policies
-- -----------------------------------------------------

-- Product options: Consolidate 2 read policies
DROP POLICY IF EXISTS "Allow public read access to product options" ON public.product_options;
DROP POLICY IF EXISTS "Public read product_options" ON public.product_options;

CREATE POLICY "Public read product_options"
  ON public.product_options FOR SELECT
  TO public
  USING (true);

-- Product option values: Consolidate 2 read policies
DROP POLICY IF EXISTS "Allow public read access to product option values" ON public.product_option_values;
DROP POLICY IF EXISTS "Public read product_option_values" ON public.product_option_values;

CREATE POLICY "Public read product_option_values"
  ON public.product_option_values FOR SELECT
  TO public
  USING (true);

-- Payment providers: Consolidate duplicate policies
DROP POLICY IF EXISTS "Admins full access" ON public.payment_providers;
DROP POLICY IF EXISTS "Public read access" ON public.payment_providers;
DROP POLICY IF EXISTS "Public read payment_providers" ON public.payment_providers;
DROP POLICY IF EXISTS "Admins manage payment_providers" ON public.payment_providers;

CREATE POLICY "Public read payment_providers"
  ON public.payment_providers FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins manage payment_providers"
  ON public.payment_providers FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Shipping options: Consolidate policies
DROP POLICY IF EXISTS "Admins full access" ON public.shipping_options;
DROP POLICY IF EXISTS "Public read access" ON public.shipping_options;
DROP POLICY IF EXISTS "Public read shipping_options" ON public.shipping_options;
DROP POLICY IF EXISTS "Admins manage shipping_options" ON public.shipping_options;

CREATE POLICY "Public read shipping_options"
  ON public.shipping_options FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins manage shipping_options"
  ON public.shipping_options FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Addresses: Consolidate admin read policy
DROP POLICY IF EXISTS "Admins read all addresses" ON public.addresses;

CREATE POLICY "Admins read all addresses"
  ON public.addresses FOR SELECT
  TO authenticated
  USING (public.is_admin() OR user_id = (SELECT auth.uid()));

-- Orders: Consolidate read policies
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Public read orders" ON public.orders;

CREATE POLICY "Public read orders"
  ON public.orders FOR SELECT
  TO public
  USING (true);

-- Profiles: Already consolidated in step 5

-- Reward wallets: Already optimized in step 5
DROP POLICY IF EXISTS "Admins read all wallets" ON public.reward_wallets;

CREATE POLICY "Admins read all wallets"
  ON public.reward_wallets FOR SELECT
  TO authenticated
  USING (public.is_admin() OR user_id = (SELECT auth.uid()));

-- Reward transactions: Already optimized in step 5
DROP POLICY IF EXISTS "Admins read all reward transactions" ON public.reward_transactions;

CREATE POLICY "Admins read all reward transactions"
  ON public.reward_transactions FOR SELECT
  TO authenticated
  USING (public.is_admin() OR wallet_id IN (SELECT id FROM public.reward_wallets WHERE user_id = (SELECT auth.uid())));

-- -----------------------------------------------------
-- 7. Add missing foreign key indexes
-- -----------------------------------------------------

-- addresses table
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON public.addresses(user_id);

-- cart_items table
CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON public.cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON public.cart_items(product_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_variant_id ON public.cart_items(variant_id);

-- carts table
CREATE INDEX IF NOT EXISTS idx_carts_user_id ON public.carts(user_id);

-- orders table
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);

-- product_categories table
CREATE INDEX IF NOT EXISTS idx_product_categories_category_id ON public.product_categories(category_id);

-- product_collections table
CREATE INDEX IF NOT EXISTS idx_product_collections_collection_id ON public.product_collections(collection_id);

-- product_images table
CREATE INDEX IF NOT EXISTS idx_product_images_image_id ON public.product_images(image_id);

-- product_option_values table
CREATE INDEX IF NOT EXISTS idx_product_option_values_option_id ON public.product_option_values(option_id);

-- product_variants table
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON public.product_variants(product_id);

-- products table
CREATE INDEX IF NOT EXISTS idx_products_collection_id ON public.products(collection_id);

-- review_media table
CREATE INDEX IF NOT EXISTS idx_review_media_review_id ON public.review_media(review_id);

-- reviews table
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);

-- wishlist_items table
CREATE INDEX IF NOT EXISTS idx_wishlist_items_product_id ON public.wishlist_items(product_id);

COMMIT;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Run this to verify RLS is enabled on all tables:
-- SELECT schemaname, tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE schemaname = 'public' 
-- ORDER BY tablename;

-- Run this to verify all indexes were created:
-- SELECT indexname, tablename 
-- FROM pg_indexes 
-- WHERE schemaname = 'public' 
-- AND indexname LIKE 'idx_%'
-- ORDER BY tablename, indexname;

-- =====================================================
-- NEXT STEPS
-- =====================================================
-- 
-- 1. Run pnpm run lint
-- 2. Run pnpm run typecheck  
-- 3. Run pnpm run build
-- 4. Check Supabase Dashboard → Database → Security Advisor
-- 5. Test admin and regular user access
-- 
-- =====================================================
