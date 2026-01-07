    -- Add RLS policies for product_options and product_option_values to allow authenticated users to manage them

    -- Drop existing public-only policies if they exist
    DO $$
    BEGIN
        -- Drop the read-only policy for product_options
        IF EXISTS (
            SELECT 1 FROM pg_policies WHERE tablename = 'product_options' AND policyname = 'Public Access to Options'
        ) THEN
            DROP POLICY "Public Access to Options" ON product_options;
        END IF;

        -- Drop the read-only policy for product_option_values
        IF EXISTS (
            SELECT 1 FROM pg_policies WHERE tablename = 'product_option_values' AND policyname = 'Public Access to Option Values'
        ) THEN
            DROP POLICY "Public Access to Option Values" ON product_option_values;
        END IF;
    END
    $$;

    -- Create comprehensive RLS policies for product_options
    DROP POLICY IF EXISTS "Allow public read access to product options" ON product_options;
    CREATE POLICY "Allow public read access to product options"
        ON product_options
        FOR SELECT
        USING (true);

    DROP POLICY IF EXISTS "Allow authenticated users to insert product options" ON product_options;
    CREATE POLICY "Allow authenticated users to insert product options"
        ON product_options
        FOR INSERT
        TO authenticated
        WITH CHECK (true);

    DROP POLICY IF EXISTS "Allow authenticated users to update product options" ON product_options;
    CREATE POLICY "Allow authenticated users to update product options"
        ON product_options
        FOR UPDATE
        TO authenticated
        USING (true)
        WITH CHECK (true);

    DROP POLICY IF EXISTS "Allow authenticated users to delete product options" ON product_options;
    CREATE POLICY "Allow authenticated users to delete product options"
        ON product_options
        FOR DELETE
        TO authenticated
        USING (true);

    -- Create comprehensive RLS policies for product_option_values
    DROP POLICY IF EXISTS "Allow public read access to product option values" ON product_option_values;
    CREATE POLICY "Allow public read access to product option values"
        ON product_option_values
        FOR SELECT
        USING (true);

    DROP POLICY IF EXISTS "Allow authenticated users to insert product option values" ON product_option_values;
    CREATE POLICY "Allow authenticated users to insert product option values"
        ON product_option_values
        FOR INSERT
        TO authenticated
        WITH CHECK (true);

    DROP POLICY IF EXISTS "Allow authenticated users to update product option values" ON product_option_values;
    CREATE POLICY "Allow authenticated users to update product option values"
        ON product_option_values
        FOR UPDATE
        TO authenticated
        USING (true)
        WITH CHECK (true);

    DROP POLICY IF EXISTS "Allow authenticated users to delete product option values" ON product_option_values;
    CREATE POLICY "Allow authenticated users to delete product option values"
        ON product_option_values
        FOR DELETE
        TO authenticated
        USING (true);
