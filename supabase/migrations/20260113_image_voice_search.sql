-- Image and Voice Search Support
-- This migration enables pgvector and adds image embedding support to products

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Add image_embedding column to products (512 dimensions for CLIP ViT-B-32)
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS image_embedding vector(512);

-- 3. Create HNSW index for fast similarity search
-- Using cosine distance which works best with L2-normalized CLIP embeddings
-- m=16 and ef_construction=64 are optimal for datasets of 100-10,000 products
CREATE INDEX IF NOT EXISTS products_image_embedding_idx 
ON public.products USING hnsw (image_embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- 4. Create Hybrid Multimodal Search Function
-- Combines text search (FTS + trigrams + prefix) with vector similarity search
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
    -- Text search using Full-Text Search, Trigrams, and Prefix matching
    SELECT 
      p.id::TEXT as product_id,
      GREATEST(
        -- Full-text search rank (weight 0.5)
        CASE 
          WHEN search_query IS NOT NULL AND p.search_vector @@ websearch_to_tsquery('english', search_query)
          THEN ts_rank_cd(p.search_vector, websearch_to_tsquery('english', search_query)) * 0.5
          ELSE 0 
        END,
        -- Trigram similarity (weight 0.4) - fuzzy matching
        CASE 
          WHEN search_query IS NOT NULL THEN similarity(p.name, search_query) * 0.4
          ELSE 0 
        END,
        -- Prefix match (weight 0.1) - starts-with matching
        CASE 
          WHEN search_query IS NOT NULL AND p.name ILIKE search_query || '%' THEN 0.1
          ELSE 0 
        END
      ) as text_score
    FROM public.products p
    WHERE search_query IS NOT NULL
  ),
  image_scores AS (
    -- Image similarity using cosine distance on L2-normalized CLIP embeddings
    -- The <=> operator calculates cosine distance (0 = identical, 2 = opposite)
    SELECT 
      p.id::TEXT as product_id,
      -- Convert distance to similarity: higher score = more similar (0-1 range)
      1 - (p.image_embedding <=> search_embedding) as image_score
    FROM public.products p
    WHERE search_embedding IS NOT NULL
      AND p.image_embedding IS NOT NULL
  ),
  combined_scores AS (
    -- Combine text and image scores with weighted average
    SELECT 
      COALESCE(t.product_id, i.product_id) as product_id,
      CASE 
        -- Both text and image search provided: 40% text + 60% image
        WHEN t.text_score > 0 AND i.image_score IS NOT NULL 
          THEN (t.text_score * 0.4 + i.image_score * 0.6)
        -- Only text search: 100% text
        WHEN t.text_score > 0 
          THEN t.text_score
        -- Only image search: 100% image
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
    -- Get minimum variant price if variants exist, otherwise use base price
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

-- 5. Add helpful comments
COMMENT ON FUNCTION public.search_products_multimodal IS 
'Hybrid multimodal search combining text (FTS + trigrams + prefix) and image (CLIP embeddings) search.
Parameters:
- search_query: Text query for keyword search (optional)
- search_embedding: 512-dim CLIP image embedding for visual search (optional)
- match_threshold: Minimum relevance score (0.0-1.0, default 0.7)
- match_count: Maximum results to return (default 20)

Scoring:
- Text-only: FTS (50%) + Trigram (40%) + Prefix (10%)
- Image-only: Cosine similarity (100%)
- Combined: Text (40%) + Image (60%)

Returns products sorted by relevance score (highest first).';

COMMENT ON COLUMN public.products.image_embedding IS 
'512-dimensional CLIP ViT-B-32 image embedding for visual similarity search. 
Generated using Transformers.js CLIP model. Must be L2-normalized before storage.';

COMMENT ON INDEX public.products_image_embedding_idx IS
'HNSW index for fast approximate nearest neighbor search on image embeddings.
Parameters: m=16 (connections per layer), ef_construction=64 (build quality).
Optimized for datasets of 100-10,000 products.';
