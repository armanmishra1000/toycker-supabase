-- Fix Cart Items Foreign Key Constraints
-- Drop existing constraints if they exist (standard naming convention)
ALTER TABLE cart_items DROP CONSTRAINT IF EXISTS cart_items_product_id_fkey;
ALTER TABLE cart_items DROP CONSTRAINT IF EXISTS cart_items_variant_id_fkey;

-- Add back with ON DELETE CASCADE
ALTER TABLE cart_items
ADD CONSTRAINT cart_items_product_id_fkey
FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

ALTER TABLE cart_items
ADD CONSTRAINT cart_items_variant_id_fkey
FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE;
