-- Advanced Text Search and Analytics
-- This migration setup Full-Text Search, Fuzzy matching, and Analytics tracking.
-- Image and Voice search features have been excluded as per project requirements.

-- 1. Enable pg_trgm for fuzzy matching (typo tolerance)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Add generated tsvector column for high-speed full-text search
-- This combines Name and Description with different weights (Title=A, Description=B)
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS search_vector tsvector 
GENERATED ALWAYS AS (
  setweight(to_tsvector('english', COALESCE(name, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(description, '')), 'B')
) STORED;

-- 3. Create GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS products_search_vector_idx 
ON public.products USING GIN (search_vector);

-- 4. Create GIN index for trigram similarity (typo tolerance on product names)
CREATE INDEX IF NOT EXISTS products_name_trgm_idx 
ON public.products USING GIN (name gin_trgm_ops);

-- 5. Create Advanced Search Function
-- This function combines FTS (ranking), Trigram (typos), and Prefix (instant) matching.
-- It also handles finding the best price from product variants.
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
) AS $$
BEGIN
  RETURN QUERY
  WITH combined_results AS (
    -- Full Text Search Ranking
    SELECT 
      p.id, p.name, p.handle, p.image_url, p.thumbnail, 
      COALESCE((SELECT min(v.price) FROM public.product_variants v WHERE v.product_id = p.id), p.price) as effective_price,
      p.currency_code,
      ts_rank_cd(p.search_vector, websearch_to_tsquery('english', search_query)) * 0.7 AS score
    FROM public.products p
    WHERE p.search_vector @@ websearch_to_tsquery('english', search_query)
    
    UNION ALL

    -- Trigram Similarity (Fuzzy matching)
    SELECT 
      p.id, p.name, p.handle, p.image_url, p.thumbnail,
      COALESCE((SELECT min(v.price) FROM public.product_variants v WHERE v.product_id = p.id), p.price) as effective_price,
      p.currency_code,
      similarity(p.name, search_query) * 0.3 AS score
    FROM public.products p
    WHERE p.name % search_query

    UNION ALL

    -- Prefix Match Fallback (Important for auto-complete feel)
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
$$ LANGUAGE plpgsql STABLE;

-- 6. Search Analytics Table
CREATE TABLE IF NOT EXISTS public.search_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  search_query TEXT NOT NULL,
  search_type TEXT NOT NULL, -- 'text', 'voice', etc.
  results_count INT NOT NULL,
  user_id TEXT,
  session_id TEXT,
  search_duration_ms INT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- Indices for analytics reporting
CREATE INDEX IF NOT EXISTS search_analytics_query_idx ON public.search_analytics(search_query);
CREATE INDEX IF NOT EXISTS search_analytics_created_at_idx ON public.search_analytics(created_at);

-- 7. Analytics Tracking Function
CREATE OR REPLACE FUNCTION public.track_search_rpc(
  p_query TEXT,
  p_type TEXT,
  p_results_count INT,
  p_user_id TEXT DEFAULT NULL,
  p_session_id TEXT DEFAULT NULL,
  p_duration_ms INT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.search_analytics (
    search_query, search_type, results_count, 
    user_id, session_id, search_duration_ms
  )
  VALUES (
    p_query, p_type, p_results_count,
    p_user_id, p_session_id, p_duration_ms
  )
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$ LANGUAGE plpgsql;
