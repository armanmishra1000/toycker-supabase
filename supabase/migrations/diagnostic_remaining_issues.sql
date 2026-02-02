-- =====================================================
-- Quick Diagnostic: What Issues Remain?
-- =====================================================
-- Run this to see exactly what's still flagged
-- =====================================================

-- 1. Check which tables still don't have RLS
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = false
ORDER BY tablename;

-- 2. Check policy count per table (find multiple permissive policies)
SELECT 
    schemaname,
    tablename,
    COUNT(*) as policy_count,
    string_agg(policyname, ', ' ORDER BY policyname) as policies
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY policy_count DESC, tablename;

-- 3. Check function search_path status
SELECT 
    p.proname as function_name,
    CASE 
        WHEN p.proconfig IS NULL THEN 'NOT SET'
        ELSE array_to_string(p.proconfig, ', ')
    END as search_path_config
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname IN (
    'update_updated_at_column',
    'parent_category',
    'increment_promotion_uses',
    'search_products_multimodal',
    'search_products_advanced',
    'create_order_with_payment',
    'track_search_rpc'
)
ORDER BY p.proname;

-- 4. Check extensions schema
SELECT 
    e.extname,
    n.nspname as current_schema
FROM pg_extension e
JOIN pg_namespace n ON e.extnamespace = n.oid
WHERE e.extname IN ('pg_trgm', 'unaccent')
ORDER BY e.extname;

-- 5. Test similarity function
SELECT similarity('test', 'testing') as similarity_works;

-- 6. Check for overly permissive policies (WITH CHECK = true)
SELECT 
    tablename,
    policyname,
    cmd as command,
    qual as using_clause,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
AND (
    with_check = 'true'
    OR qual = 'true'
)
AND cmd != 'SELECT'  -- Exclude SELECT policies (public read is OK)
ORDER BY tablename, policyname;
