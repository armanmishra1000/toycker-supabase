-- Fix Cart Items Variant Nullability
-- Allow variant_id to be NULL to support "Single Products" (no variants)
ALTER TABLE public.cart_items ALTER COLUMN variant_id DROP NOT NULL;

-- Ensure the foreign key still exists but allows NULL
-- (The existing constraint 'cart_items_variant_id_fkey' already allows NULL unless the column is NOT NULL)
