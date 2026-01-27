-- Restore and Finalize Multimodal Search
-- This migration ensures pgvector is enabled and the multimodal search function is ready.

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Ensure image_embedding column exists
-- CLIP ViT-B-32 produces 512-dimensional embeddings
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS image_embedding vector(512);

-- 3. Create HNSW index for fast similarity search
-- Using cosine distance for L2-normalized CLIP embeddings
CREATE INDEX IF NOT EXISTS products_image_embedding_idx 
ON public.products USING hnsw (image_embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- 4. Create Multimodal Search Function
-- This hybrid function combines text search and visual search with weighted scoring.
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
) AS $$
BEGIN
  RETURN QUERY
  WITH text_scores AS (
    -- Text search ranking (FTS + Trigrams + Prefix)
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
    -- Image similarity score (1 - cosine distance)
    SELECT 
      p.id::TEXT as product_id,
      1 - (p.image_embedding <=> search_embedding) as image_score
    FROM public.products p
    WHERE search_embedding IS NOT NULL
      AND p.image_embedding IS NOT NULL
  ),
  combined_scores AS (
    -- Weighted combination of text (40%) and image (60%) scores
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
$$ LANGUAGE plpgsql STABLE;

-- 5. Track that this migration has been applied
COMMENT ON FUNCTION public.search_products_multimodal IS 'Hybrid search combining text and image embeddings. Last updated 2026-01-27.';
