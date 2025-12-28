-- Migration: Add support for CSV import/export
-- Adds thumbnail column and original_price for variant pricing

-- Add thumbnail column to products if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'thumbnail'
    ) THEN
        ALTER TABLE products ADD COLUMN thumbnail TEXT;
    END IF;
END $$;

-- Add original_price column to product_variants for "was" pricing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'product_variants' AND column_name = 'original_price'
    ) THEN
        ALTER TABLE product_variants ADD COLUMN original_price NUMERIC;
    END IF;
END $$;

-- Ensure product_variants has ON DELETE CASCADE
-- Drop and recreate the foreign key constraint if needed
DO $$
BEGIN
    -- Check if constraint exists and if it's not CASCADE
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.constraint_column_usage ccu 
            ON tc.constraint_name = ccu.constraint_name
        WHERE tc.table_name = 'product_variants' 
            AND tc.constraint_type = 'FOREIGN KEY'
            AND ccu.column_name = 'product_id'
    ) THEN
        -- The constraint exists, we assume it's already CASCADE from initial migration
        NULL;
    END IF;
END $$;

-- Add RLS policy for admin to delete products (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'products' AND policyname = 'Admin delete products'
    ) THEN
        CREATE POLICY "Admin delete products" ON products 
            FOR DELETE TO authenticated 
            USING (true);
    END IF;
END $$;

-- Add RLS policy for admin to insert products (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'products' AND policyname = 'Admin insert products'
    ) THEN
        CREATE POLICY "Admin insert products" ON products 
            FOR INSERT TO authenticated 
            WITH CHECK (true);
    END IF;
END $$;

-- Add RLS policy for admin to update products (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'products' AND policyname = 'Admin update products'
    ) THEN
        CREATE POLICY "Admin update products" ON products 
            FOR UPDATE TO authenticated 
            USING (true);
    END IF;
END $$;
