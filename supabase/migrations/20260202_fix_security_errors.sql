-- =====================================================
-- Supabase Security Errors Fix - Phase 1
-- =====================================================
-- Fixes 4 of 6 CRITICAL security errors:
--   1. Security Definer Views (3 views)
--   2. Sensitive Column Documentation (search_analytics)
-- =====================================================
-- Issue Reference: Supabase Dashboard Security Lints
-- Date: 2026-02-02
-- =====================================================

BEGIN;

-- =====================================================
-- CRITICAL FIX 1: Convert Security Definer Views to Security Invoker
-- =====================================================
-- Issue: Views created without security_invoker bypass RLS policies
-- Impact: Data from underlying tables exposed regardless of user permissions
-- Solution: Add WITH (security_invoker = true) to enforce RLS
-- Reference: https://supabase.com/docs/guides/database/database-linter?lint=0010_security_definer_view

-- -----------------------------------------------------
-- View 1: products_with_variants
-- -----------------------------------------------------
-- Before: Bypasses RLS on products and product_variants tables
-- After: Respects RLS policies for the querying user

-- DROP first to avoid column mismatch errors
DROP VIEW IF EXISTS public.products_with_variants CASCADE;

CREATE VIEW public.products_with_variants 
WITH (security_invoker = true) AS
SELECT 
    p.*,
    (
        SELECT jsonb_agg(v.*)
        FROM public.product_variants v
        WHERE v.product_id = p.id
    ) as variants_data,
    COALESCE(
        (SELECT min(price) FROM public.product_variants v WHERE v.product_id = p.id),
        p.price
    ) as min_price,
    COALESCE(
        (SELECT sum(inventory_quantity) FROM public.product_variants v WHERE v.product_id = p.id),
        p.stock_count
    ) as total_inventory
FROM 
    public.products p;

COMMENT ON VIEW public.products_with_variants IS 
  'Secure view (security_invoker) - aggregates product data with variants. Respects RLS policies.';

-- -----------------------------------------------------
-- View 2: order_details_view
-- -----------------------------------------------------
-- Before: Bypasses RLS on orders and profiles tables
-- After: Respects RLS policies for the querying user

-- DROP first to avoid column mismatch errors
DROP VIEW IF EXISTS public.order_details_view CASCADE;

CREATE VIEW public.order_details_view
WITH (security_invoker = true) AS
SELECT 
    o.*,
    p.role as user_role
FROM 
    public.orders o
LEFT JOIN 
    public.profiles p ON o.user_id = p.id;

COMMENT ON VIEW public.order_details_view IS 
  'Secure view (security_invoker) - joins orders with user role. Respects RLS policies.';

-- -----------------------------------------------------
-- View 3: cart_items_extended
-- -----------------------------------------------------
-- Before: Bypasses RLS on cart_items, products, and product_variants
-- After: Respects RLS policies for the querying user

-- DROP first to avoid column mismatch errors
DROP VIEW IF EXISTS public.cart_items_extended CASCADE;

CREATE VIEW public.cart_items_extended
WITH (security_invoker = true) AS
SELECT 
    ci.*,
    p.name as product_name,
    p.handle as product_handle,
    p.image_url as product_thumbnail,
    v.title as variant_title,
    v.sku as variant_sku
FROM 
    public.cart_items ci
JOIN 
    public.products p ON ci.product_id = p.id
LEFT JOIN 
    public.product_variants v ON ci.variant_id = v.id;

COMMENT ON VIEW public.cart_items_extended IS 
  'Secure view (security_invoker) - extends cart items with product details. Respects RLS policies.';

-- =====================================================
-- CRITICAL FIX 2: Search Analytics Sensitive Column Protection
-- =====================================================
-- Table: search_analytics
-- Sensitive Column: session_id
-- Current State: Table has RLS enabled (from 20260123_supabase_optimization_v2.sql)
--   - Admin-only SELECT policy protects session_id from non-admin access
--   - Public can only INSERT (append-only for tracking)
-- Action: Add documentation to clarify security posture

COMMENT ON TABLE public.search_analytics IS 
  'Search analytics table with RLS protection. Contains sensitive session_id data accessible only to admins via is_admin() policy.';

COMMENT ON COLUMN public.search_analytics.session_id IS 
  'SENSITIVE: Session identifier. Protected by RLS - only accessible to admins. Never select this column in public-facing queries.';

COMMENT ON COLUMN public.search_analytics.user_id IS 
  'User identifier. Protected by RLS - only accessible to admins for analytics purposes.';

-- Enable RLS if not already enabled
ALTER TABLE public.search_analytics ENABLE ROW LEVEL SECURITY;

-- Create policies if they don't exist (idempotent)
DO $$
BEGIN
  -- Policy for public INSERT (tracking)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'search_analytics' 
    AND policyname = 'Public can insert search_analytics'
  ) THEN
    EXECUTE 'CREATE POLICY "Public can insert search_analytics"
      ON public.search_analytics FOR INSERT
      TO public
      WITH CHECK (true)';
  END IF;

  -- Policy for admin SELECT (analytics)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'search_analytics' 
    AND policyname = 'Admins can manage search_analytics'
  ) THEN
    EXECUTE 'CREATE POLICY "Admins can manage search_analytics"
      ON public.search_analytics FOR SELECT
      TO authenticated
      USING (public.is_admin())';
  END IF;
END $$;

COMMIT;

-- =====================================================
-- POST-MIGRATION VERIFICATION
-- =====================================================
-- Run these queries to verify the fixes:
--
-- 1. Verify views are now security_invoker:
--    SELECT c.relname, c.reloptions
--    FROM pg_class c
--    WHERE c.relname IN ('products_with_variants', 'order_details_view', 'cart_items_extended')
--      AND c.relkind = 'v';
--    Expected: reloptions should contain 'security_invoker=true'
--
-- 2. Test view RLS enforcement as different users:
--    SET ROLE authenticated;
--    SET request.jwt.claims.sub TO '<test-user-id>';
--    SELECT COUNT(*) FROM products_with_variants;
--    Expected: Only products allowed by RLS policies
--
-- 3. Verify search_analytics RLS:
--    SELECT tablename, policyname, roles, cmd, qual
--    FROM pg_policies
--    WHERE tablename = 'search_analytics';
--    Expected: Admin-only SELECT policy, Public INSERT policy
-- =====================================================
