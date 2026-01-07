-- Enable the pgvector extension to work with embedding vectors
create extension if not exists vector;

-- Add checking for embedding column to products table
-- We use 512 dimensions for "Xenova/clip-vit-base-patch32" (standard CLIP small)
-- OR 384 for "Xenova/all-MiniLM-L6-v2" (text models), but for IMAGE search we need CLIP.
-- CLIP ViT-B/32 output dimension is 512.
alter table products add column if not exists embedding vector(512);

-- Create a function to search for products by image embedding
drop function if exists match_products(vector(512), float, int);

create or replace function match_products (
  query_embedding vector(512),
  match_threshold float,
  match_count int
)
returns table (
  id text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    products.id,
    1 - (products.embedding <=> query_embedding) as similarity
  from products
  where 1 - (products.embedding <=> query_embedding) > match_threshold
  order by products.embedding <=> query_embedding
  limit match_count;
end;
$$;
