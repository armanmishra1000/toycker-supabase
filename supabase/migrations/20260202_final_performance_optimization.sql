-- =====================================================
-- Final Performance Optimization - Fix Auth RLS initplan
-- =====================================================
-- This migration fixes 3 remaining performance issues
-- by wrapping auth.uid() calls in SELECT subqueries
-- 
-- Issues Fixed:
-- - orders: "Customers can see their own orders" policy
-- - orders: "Admins can see all orders" policy  
-- - profiles: "Only users with customers:delete" policy
--
-- Impact: Reduces 42 issues → 39 issues
-- Remaining: 39 acceptable design trade-offs
-- =====================================================
-- Date: 2026-02-02
-- =====================================================

BEGIN;

-- =====================================================
-- FIX 1: Optimize orders RLS policies
-- =====================================================

-- Drop and recreate "Customers can see their own orders"
DROP POLICY IF EXISTS "Customers can see their own orders" ON public.orders;

CREATE POLICY "Customers can see their own orders"
  ON public.orders FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));  -- Wrapped in SELECT for caching

-- Drop and recreate "Admins can see all orders"
DROP POLICY IF EXISTS "Admins can see all orders" ON public.orders;

CREATE POLICY "Admins can see all orders"
  ON public.orders FOR ALL
  TO authenticated
  USING ((SELECT public.is_admin()))  -- Wrapped in SELECT for caching
  WITH CHECK ((SELECT public.is_admin()));

-- =====================================================
-- FIX 2: Optimize profiles RLS policy
-- =====================================================

-- Drop and recreate "Only users with customers:delete can delete customers"
DROP POLICY IF EXISTS "Only users with customers:delete can delete customers" ON public.profiles;

CREATE POLICY "Only users with customers:delete can delete customers"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (
    (SELECT public.has_permission('customers:delete'))  -- Wrapped in SELECT for caching
  );

COMMIT;

-- =====================================================
-- VERIFICATION
-- =====================================================
-- After running this migration:
-- 1. Go to Database → Linter in Supabase Dashboard
-- 2. Refresh the linter
-- 3. Expected: 39 issues (down from 42)
-- 
-- Remaining issues breakdown:
-- - 37 "Multiple permissive policies" (design choice for maintainability)
-- - 1 "search_analytics policy" (intentional for anonymous tracking)
-- - 1 "Leaked password protection" (requires Pro plan)
--
-- These 39 issues are ACCEPTABLE and do not need fixing.
-- =====================================================
