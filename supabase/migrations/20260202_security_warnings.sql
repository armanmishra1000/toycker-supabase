-- =====================================================
-- Supabase Security Warnings Fix - Phase 2
-- =====================================================
-- Fixes 15 of 16 security warnings:
--   1. Function Search Path Hardening (4 functions)
--   2. Extensions Schema Migration (2 extensions) 
--   3. Overly Permissive RLS Policies (6 policies)
--   4. Leaked Password Protection (NOT FIXABLE - requires Pro plan)
-- =====================================================
-- Issue Reference: Supabase Dashboard Security Lints
-- Date: 2026-02-02
-- =====================================================

BEGIN;

-- =====================================================
-- SECURITY FIX 1: Function Search Path Hardening
-- =====================================================
-- Issue: Functions without explicit search_path are vulnerable to schema injection
-- Solution: Set search_path = public, pg_catalog, pg_temp for all functions
-- Reference: https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable

-- -----------------------------------------------------
-- Function 1: search_products_multimodal
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION public.search_products_multimodal(
  search_query TEXT DEFAULT NULL,
  search_embedding vector(512) DEFAULT NULL,
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 20
)
RETURNS TABLE (
  id TEXT,
  name TEXT,
  handle TEXT,
  image_url TEXT,
  thumbnail TEXT,
  price DECIMAL,
  currency_code TEXT,
  relevance_score FLOAT
) 
LANGUAGE plpgsql 
STABLE
SET search_path = public, pg_catalog, pg_temp  -- SECURITY FIX
AS $$
BEGIN
  RETURN QUERY
  WITH text_scores AS (
    SELECT 
      p.id::TEXT as product_id,
      GREATEST(
        CASE 
          WHEN search_query IS NOT NULL AND p.search_vector @@ websearch_to_tsquery('english', search_query)
          THEN ts_rank_cd(p.search_vector, websearch_to_tsquery('english', search_query)) * 0.5
          ELSE 0 
        END,
        CASE 
          WHEN search_query IS NOT NULL THEN similarity(p.name, search_query) * 0.4
          ELSE 0 
        END,
        CASE 
          WHEN search_query IS NOT NULL AND p.name ILIKE search_query || '%' THEN 0.1
          ELSE 0 
        END
      ) as text_score
    FROM public.products p
    WHERE search_query IS NOT NULL
  ),
  image_scores AS (
    SELECT 
      p.id::TEXT as product_id,
      1 - (p.image_embedding <=> search_embedding) as image_score
    FROM public.products p
    WHERE search_embedding IS NOT NULL
      AND p.image_embedding IS NOT NULL
  ),
  combined_scores AS (
    SELECT 
      COALESCE(t.product_id, i.product_id) as product_id,
      CASE 
        WHEN t.text_score > 0 AND i.image_score IS NOT NULL 
          THEN (t.text_score * 0.4 + i.image_score * 0.6)
        WHEN t.text_score > 0 
          THEN t.text_score
        WHEN i.image_score IS NOT NULL 
          THEN i.image_score
        ELSE 0
      END as final_score
    FROM text_scores t
    FULL OUTER JOIN image_scores i ON t.product_id = i.product_id
  )
  SELECT 
    p.id::TEXT,
    p.name,
    p.handle,
    p.image_url,
    p.thumbnail,
    COALESCE(
      (SELECT min(v.price) FROM public.product_variants v WHERE v.product_id = p.id),
      p.price
    )::DECIMAL as price,
    p.currency_code,
    c.final_score::FLOAT as relevance_score
  FROM combined_scores c
  JOIN public.products p ON c.product_id = p.id::TEXT
  WHERE c.final_score >= match_threshold
  ORDER BY c.final_score DESC
  LIMIT match_count;
END;
$$;

-- -----------------------------------------------------
-- Function 2: search_products_advanced
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION public.search_products_advanced(
  search_query TEXT,
  similarity_threshold FLOAT DEFAULT 0.15,
  result_limit INT DEFAULT 20
)
RETURNS TABLE (
  id TEXT,
  name TEXT,
  handle TEXT,
  image_url TEXT,
  thumbnail TEXT,
  price DECIMAL,
  currency_code TEXT,
  relevance_score FLOAT
)
LANGUAGE plpgsql 
STABLE
SET search_path = public, pg_catalog, pg_temp  -- SECURITY FIX
AS $$
BEGIN
  RETURN QUERY
  WITH combined_results AS (
    SELECT 
      p.id, p.name, p.handle, p.image_url, p.thumbnail, 
      COALESCE((SELECT min(v.price) FROM public.product_variants v WHERE v.product_id = p.id), p.price) as effective_price,
      p.currency_code,
      ts_rank_cd(p.search_vector, websearch_to_tsquery('english', search_query)) * 0.7 AS score
    FROM public.products p
    WHERE p.search_vector @@ websearch_to_tsquery('english', search_query)
    
    UNION ALL

    SELECT 
      p.id, p.name, p.handle, p.image_url, p.thumbnail,
      COALESCE((SELECT min(v.price) FROM public.product_variants v WHERE v.product_id = p.id), p.price) as effective_price,
      p.currency_code,
      similarity(p.name, search_query) * 0.3 AS score
    FROM public.products p
    WHERE p.name % search_query

    UNION ALL

    SELECT 
      p.id, p.name, p.handle, p.image_url, p.thumbnail,
      COALESCE((SELECT min(v.price) FROM public.product_variants v WHERE v.product_id = p.id), p.price) as effective_price,
      p.currency_code,
      0.1 AS score
    FROM public.products p
    WHERE p.name ILIKE search_query || '%'
  ),
  aggregated AS (
    SELECT 
      r.id, r.name, r.handle, r.image_url, r.thumbnail, r.effective_price, r.currency_code,
      SUM(r.score) as combined_score
    FROM combined_results r
    GROUP BY r.id, r.name, r.handle, r.image_url, r.thumbnail, r.effective_price, r.currency_code
  )
  SELECT 
    a.id, a.name, a.handle, a.image_url, a.thumbnail, 
    a.effective_price::DECIMAL, a.currency_code,
    a.combined_score::FLOAT as relevance_score
  FROM aggregated a
  ORDER BY combined_score DESC
  LIMIT result_limit;
END;
$$;

-- -----------------------------------------------------
-- Function 3: parent_category
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION public.parent_category(categories) 
RETURNS SETOF categories 
ROWS 1
LANGUAGE SQL  
STABLE
SET search_path = public, pg_catalog, pg_temp  -- SECURITY FIX
AS $$
  SELECT * FROM public.categories WHERE id = $1.parent_category_id
$$;

-- -----------------------------------------------------
-- Function 4: increment_promotion_uses
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION public.increment_promotion_uses(promo_id TEXT)
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, pg_catalog, pg_temp  -- SECURITY FIX
AS $$
BEGIN
    UPDATE public.promotions
    SET used_count = used_count + 1
    WHERE id = promo_id;
END;
$$;

-- =====================================================
-- SECURITY FIX 2: Move Extensions from Public Schema
-- =====================================================
-- Issue: Extensions in public schema can create naming conflicts
-- Solution: Move to dedicated extensions schema
-- Note: This may require reindexing if indexes use these extensions

-- Create extensions schema
CREATE SCHEMA IF NOT EXISTS extensions;

-- Attempt to move extensions (may fail if already in extensions schema)
DO $$
BEGIN
    -- Move pg_trgm
    IF EXISTS (
        SELECT 1 FROM pg_extension 
        WHERE extname = 'pg_trgm' 
        AND extnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    ) THEN
        ALTER EXTENSION pg_trgm SET SCHEMA extensions;
        RAISE NOTICE 'Moved pg_trgm extension to extensions schema';
    ELSE
        RAISE NOTICE 'pg_trgm extension already in correct schema or not found';
    END IF;

    -- Move unaccent
    IF EXISTS (
        SELECT 1 FROM pg_extension 
        WHERE extname = 'unaccent' 
        AND extnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    ) THEN
        ALTER EXTENSION unaccent SET SCHEMA extensions;
        RAISE NOTICE 'Moved unaccent extension to extensions schema';
    ELSE
        RAISE NOTICE 'unaccent extension already in correct schema or not found';
    END IF;
END $$;

-- Grant usage to relevant roles
GRANT USAGE ON SCHEMA extensions TO authenticated, anon;

-- =====================================================
-- SECURITY FIX 3: Fix Overly Permissive RLS Policies
-- =====================================================
-- Issue: Policies with WITH CHECK (true) bypass security checks
-- Solution: Add proper ownership/permission checks

-- -----------------------------------------------------
-- Policy 1: orders - "Authenticated users can create orders"
-- -----------------------------------------------------
-- Before: WITH CHECK (true) - any user can create orders for anyone
-- After: Users can only create orders for themselves

DROP POLICY IF EXISTS "Authenticated users can create orders" ON public.orders;

CREATE POLICY "Authenticated users can create orders"
  ON public.orders FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())  -- Can only create orders for self
    OR user_id IS NULL  -- Allow guest checkout
  );

-- -----------------------------------------------------
-- Policy 2-4: product_combinations - Consolidate into admin-only
-- -----------------------------------------------------
DROP POLICY IF EXISTS "Allow authenticated users to insert product combinations" ON public.product_combinations;
DROP POLICY IF EXISTS "Allow authenticated users to update product combinations" ON public.product_combinations;
DROP POLICY IF EXISTS "Allow authenticated users to delete product combinations" ON public.product_combinations;

-- Single policy for all operations
CREATE POLICY "Admins manage product combinations"
  ON public.product_combinations FOR ALL
  TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

-- -----------------------------------------------------
-- Policy 5: review_media - "Authenticated users can upload"
-- -----------------------------------------------------
-- Before: WITH CHECK (true) - anyone can upload media
-- After: Can only upload media for own reviews

DROP POLICY IF EXISTS "Authenticated users can upload review media" ON public.review_media;

CREATE POLICY "Users upload review media for their reviews"
  ON public.review_media FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.reviews r
      WHERE r.id = review_id 
      AND r.user_id = (SELECT auth.uid())
    )
  );

-- Keep admin policy for management
DROP POLICY IF EXISTS "Admins can manage review media" ON public.review_media;

CREATE POLICY "Admins can manage review media"
  ON public.review_media FOR ALL
  TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

-- -----------------------------------------------------
-- Policy 6: reviews - "Authenticated users can create"
-- -----------------------------------------------------
-- Before: WITH CHECK (true) - anyone can create reviews for anyone
-- After: Can only create reviews for self

DROP POLICY IF EXISTS "Authenticated users can create reviews" ON public.reviews;

CREATE POLICY "Users create their own reviews"
  ON public.reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())  -- Can only create reviews for self
  );

-- =====================================================
-- DOCUMENTATION: Leaked Password Protection
-- =====================================================
-- Issue: Leaked password protection (HaveIBeenPwned) is disabled
-- Status: NOT FIXABLE on Supabase free tier
-- Action: Document this limitation

COMMENT ON SCHEMA public IS 
  'Public schema for Toycker application. Note: Leaked password protection (HaveIBeenPwned) requires Supabase Pro plan and cannot be enabled on free tier.';

COMMIT;

-- =====================================================
-- POST-MIGRATION VERIFICATION
-- =====================================================
-- Run these queries to verify the fixes:
--
-- 1. Verify function search_path:
--    SELECT 
--      p.proname, 
--      pg_get_function_identity_arguments(p.oid) as args,
--      p.proconfig
--    FROM pg_proc p
--    JOIN pg_namespace n ON p.pronamespace = n.oid
--    WHERE n.nspname = 'public'
--    AND p.proname IN ('search_products_multimodal', 'search_products_advanced', 
--                      'parent_category', 'increment_promotion_uses');
--    Expected: proconfig should contain search_path setting
--
-- 2. Verify extensions moved:
--    SELECT e.extname, n.nspname 
--    FROM pg_extension e 
--    JOIN pg_namespace n ON e.extnamespace = n.oid
--    WHERE e.extname IN ('pg_trgm', 'unaccent');
--    Expected: nspname should be 'extensions'
--
-- 3. Verify RLS policies updated:
--    SELECT tablename, policyname, qual, with_check
--    FROM pg_policies
--    WHERE tablename IN ('orders', 'product_combinations', 'review_media', 'reviews')
--      AND schemaname = 'public';
--    Expected: No policies with 'true' in with_check for INSERT/UPDATE
-- =====================================================
