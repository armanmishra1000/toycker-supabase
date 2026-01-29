-- Add SEO fields to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS seo_title TEXT,
ADD COLUMN IF NOT EXISTS seo_description TEXT,
ADD COLUMN IF NOT EXISTS seo_metadata JSONB DEFAULT '{}';

-- Add GIN index for seo_metadata for faster lookups if needed
CREATE INDEX IF NOT EXISTS idx_products_seo_metadata_gin ON products USING GIN (seo_metadata);
