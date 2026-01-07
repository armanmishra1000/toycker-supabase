-- Add compare_at_price column to product_variants
-- This allows showing original/sale prices on products
ALTER TABLE product_variants
ADD COLUMN compare_at_price NUMERIC DEFAULT NULL;

-- Add index for performance on price filtering/sorting
CREATE INDEX IF NOT EXISTS idx_product_variants_compare_at_price
ON product_variants(compare_at_price);
