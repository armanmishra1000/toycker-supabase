-- Migration: Add missing columns to products and product_variants tables
-- Run this in Supabase Dashboard -> SQL Editor

-- Ensure UUID extension is enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Fix id column defaults for ALL tables
ALTER TABLE categories ALTER COLUMN id SET DEFAULT ('cat_' || uuid_generate_v4());
ALTER TABLE collections ALTER COLUMN id SET DEFAULT ('col_' || uuid_generate_v4());
ALTER TABLE products ALTER COLUMN id SET DEFAULT ('prod_' || uuid_generate_v4());
ALTER TABLE product_variants ALTER COLUMN id SET DEFAULT ('var_' || uuid_generate_v4());

-- Add missing columns to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE products ADD COLUMN IF NOT EXISTS thumbnail TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS images TEXT[];
ALTER TABLE products ADD COLUMN IF NOT EXISTS currency_code TEXT DEFAULT 'inr';
ALTER TABLE products ADD COLUMN IF NOT EXISTS subtitle TEXT;

-- Add original_price to variants for "was" pricing
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS original_price NUMERIC;

-- ===== RLS POLICIES FOR ADMIN INSERT/UPDATE/DELETE =====

-- Categories: allow authenticated users to INSERT, UPDATE, DELETE
DROP POLICY IF EXISTS "Allow authenticated insert categories" ON categories;
CREATE POLICY "Allow authenticated insert categories" ON categories FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated update categories" ON categories;
CREATE POLICY "Allow authenticated update categories" ON categories FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated delete categories" ON categories;
CREATE POLICY "Allow authenticated delete categories" ON categories FOR DELETE TO authenticated USING (true);

-- Collections: allow authenticated users to INSERT, UPDATE, DELETE
DROP POLICY IF EXISTS "Allow authenticated insert collections" ON collections;
CREATE POLICY "Allow authenticated insert collections" ON collections FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated update collections" ON collections;
CREATE POLICY "Allow authenticated update collections" ON collections FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated delete collections" ON collections;
CREATE POLICY "Allow authenticated delete collections" ON collections FOR DELETE TO authenticated USING (true);

-- Products: allow authenticated users to INSERT, UPDATE, DELETE  
DROP POLICY IF EXISTS "Allow authenticated insert products" ON products;
CREATE POLICY "Allow authenticated insert products" ON products FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated update products" ON products;
CREATE POLICY "Allow authenticated update products" ON products FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated delete products" ON products;
CREATE POLICY "Allow authenticated delete products" ON products FOR DELETE TO authenticated USING (true);

-- Product Variants: allow authenticated users to INSERT, UPDATE, DELETE
DROP POLICY IF EXISTS "Allow authenticated insert variants" ON product_variants;
CREATE POLICY "Allow authenticated insert variants" ON product_variants FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated update variants" ON product_variants;
CREATE POLICY "Allow authenticated update variants" ON product_variants FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated delete variants" ON product_variants;
CREATE POLICY "Allow authenticated delete variants" ON product_variants FOR DELETE TO authenticated USING (true);
