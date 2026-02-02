-- =====================================================
-- Fix Extension Search Path - Hotfix
-- =====================================================
-- Purpose: Fix similarity() function not found error
-- Issue: After moving pg_trgm to extensions schema, the
--        similarity() function is no longer in search_path
-- Solution: Update search_path for all affected functions
--           and set database default search_path
-- =====================================================
-- Date: 2026-02-02
-- =====================================================

BEGIN;

-- =====================================================
-- FIX 1: Update search_path for search functions
-- =====================================================
-- Add 'extensions' schema to search_path so similarity()
-- and other extension functions are accessible

-- Function: search_products_multimodal
ALTER FUNCTION public.search_products_multimodal(TEXT, vector(512), FLOAT, INT)
  SET search_path = public, extensions, pg_catalog, pg_temp;

-- Function: search_products_advanced  
ALTER FUNCTION public.search_products_advanced(TEXT, FLOAT, INT)
  SET search_path = public, extensions, pg_catalog, pg_temp;

COMMENT ON FUNCTION public.search_products_multimodal IS 
  'Hybrid text + image search. Search path includes extensions schema for pg_trgm functions.';

COMMENT ON FUNCTION public.search_products_advanced IS 
  'Advanced text search with FTS + trigrams. Search path includes extensions schema for pg_trgm functions.';

-- =====================================================
-- FIX 2: Set database default search_path
-- =====================================================
-- Ensure all future sessions include extensions schema

-- Note: This affects the entire database
-- Alternative: Can set per-role if needed
ALTER DATABASE postgres SET search_path TO public, extensions, pg_catalog;

COMMENT ON SCHEMA extensions IS 
  'Schema for PostgreSQL extensions. Included in default search_path for database.';

-- =====================================================
-- FIX 3: Grant necessary permissions
-- =====================================================
-- Ensure anon and authenticated can use extension functions

GRANT USAGE ON SCHEMA extensions TO anon, authenticated;

COMMIT;

-- =====================================================
-- POST-FIX VERIFICATION
-- =====================================================
-- Run these queries to verify the fix:
--
-- 1. Check function search_path:
--    SELECT p.proname, p.proconfig
--    FROM pg_proc p
--    JOIN pg_namespace n ON p.pronamespace = n.oid
--    WHERE n.nspname = 'public'
--    AND p.proname LIKE 'search_products%';
--    Expected: proconfig includes 'extensions' in search_path
--
-- 2. Check database search_path:
--    SELECT name, setting FROM pg_settings WHERE name = 'search_path';
--    Expected: setting includes 'public, extensions, pg_catalog'
--
-- 3. Test similarity function:
--    SELECT similarity('test', 'testing');
--    Expected: Returns a float value (e.g., 0.5)
-- =====================================================
