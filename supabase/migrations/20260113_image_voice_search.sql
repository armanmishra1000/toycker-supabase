-- Image and Voice Search Support
-- This migration enables pgvector and adds image embedding support to products.

-- 1. Enable extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- 2. Add image_embedding column to products
-- We use 512 dimensions for CLIP-ViT-B-32
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS image_embedding vector(512);

-- 3. Create HNSW index for fast similarity search
CREATE INDEX IF NOT EXISTS products_image_embedding_idx 
ON public.products USING hnsw (image_embedding vector_cosine_ops);

-- 4. Create Hybrid Multimodal Search Function
-- This function combines Text Search (FTS + Trigram + Prefix) and Image Search (Vector)
CREATE OR REPLACE FUNCTION public.search_products_multimodal(
  search_query TEXT DEFAULT NULL,
  search_embedding vector(512) DEFAULT NULL,
  match_threshold FLOAT DEFAULT 0.2, -- Lowered threshold for better recall
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
DECLARE
  query_safe TEXT;
BEGIN
  -- Cleanup query
  IF search_query IS NOT NULL THEN
    query_safe := trim(search_query);
  END IF;

  RETURN QUERY
  WITH text_scores AS (
    SELECT 
      p.id as product_id,
      -- Combine multiple text search strategies
      (
        -- 1. FTS Rank (Weight 0.5)
        CASE 
          WHEN query_safe IS NOT NULL AND p.search_vector @@ websearch_to_tsquery('english', query_safe)
          THEN ts_rank_cd(p.search_vector, websearch_to_tsquery('english', query_safe)) * 0.5
          ELSE 0 
        END +
        -- 2. Trigram Similarity for fuzzy matching (Weight 0.4)
        CASE 
          WHEN query_safe IS NOT NULL THEN similarity(p.name, query_safe) * 0.4
          ELSE 0 
        END +
        -- 3. Prefix match (Weight 0.1) - good for "mac" matching "Machine"
        CASE 
          WHEN query_safe IS NOT NULL AND p.name ILIKE query_safe || '%' THEN 0.1
          ELSE 0 
        END
      ) as text_score
    FROM public.products p
    WHERE query_safe IS NOT NULL
  ),
  image_scores AS (
    SELECT 
      p.id as product_id,
      1 - (p.image_embedding <=> search_embedding) as image_score
    FROM public.products p
    WHERE search_embedding IS NOT NULL
  ),
  combined_scores AS (
    SELECT 
      p.id as product_id,
      CASE 
        -- If both text and image search are provided
        WHEN t.text_score > 0 AND i.image_score IS NOT NULL 
          THEN (t.text_score * 0.5 + i.image_score * 0.5)
        -- If only text search
        WHEN t.text_score > 0 
          THEN t.text_score
        -- If only image search
        WHEN i.image_score IS NOT NULL 
          THEN i.image_score
        ELSE 0
      END as final_score
    FROM public.products p
    LEFT JOIN text_scores t ON p.id = t.product_id
    LEFT JOIN image_scores i ON p.id = i.product_id
    WHERE (t.text_score > 0) OR (i.image_score IS NOT NULL AND i.image_score > match_threshold)
  )
  SELECT 
    p.id, p.name, p.handle, p.image_url, p.thumbnail,
    COALESCE((SELECT min(v.price) FROM public.product_variants v WHERE v.product_id = p.id), p.price)::DECIMAL as price,
    p.currency_code,
    c.final_score::FLOAT as relevance_score
  FROM combined_scores c
  JOIN public.products p ON c.product_id = p.id
  ORDER BY c.final_score DESC
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql STABLE;
