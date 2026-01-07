-- Fix type mismatches in product_options and product_option_values tables
-- The products.id and product_variants.id are TEXT type, but the foreign keys in
-- product_options and product_option_values were defined as UUID

-- Step 1: Drop foreign key constraints
DO $$
BEGIN
    -- Drop variant_id foreign key constraint
    IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'product_option_values_variant_id_fkey'
    ) THEN
        ALTER TABLE product_option_values DROP CONSTRAINT product_option_values_variant_id_fkey;
    END IF;

    -- Drop product_id foreign key constraint
    IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'product_options_product_id_fkey'
    ) THEN
        ALTER TABLE product_options DROP CONSTRAINT product_options_product_id_fkey;
    END IF;
END $$;

-- Step 2: Alter columns to TEXT type to match the referenced tables
ALTER TABLE product_options
ALTER COLUMN product_id TYPE TEXT USING product_id::TEXT;

ALTER TABLE product_option_values
ALTER COLUMN variant_id TYPE TEXT USING variant_id::TEXT;

-- Step 3: Re-create foreign key constraints with correct types
ALTER TABLE product_options
ADD CONSTRAINT product_options_product_id_fkey
FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

ALTER TABLE product_option_values
ADD CONSTRAINT product_option_values_variant_id_fkey
FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE;

-- Step 4: Recreate indexes for performance
DROP INDEX IF EXISTS idx_product_options_product_id;
CREATE INDEX idx_product_options_product_id ON product_options(product_id);

DROP INDEX IF EXISTS idx_product_option_values_variant_id;
CREATE INDEX idx_product_option_values_variant_id ON product_option_values(variant_id);
