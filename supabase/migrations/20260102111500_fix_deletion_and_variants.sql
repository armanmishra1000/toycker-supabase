-- Fix constraints for cart_items to allow product deletion and optional variants
ALTER TABLE cart_items
DROP CONSTRAINT IF EXISTS cart_items_product_id_fkey,
DROP CONSTRAINT IF EXISTS cart_items_variant_id_fkey;

-- Add back with ON DELETE CASCADE and make variant_id nullable
ALTER TABLE cart_items
ALTER COLUMN variant_id DROP NOT NULL,
ADD CONSTRAINT cart_items_product_id_fkey 
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
ADD CONSTRAINT cart_items_variant_id_fkey 
    FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE;
