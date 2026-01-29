-- Create product_combinations table
CREATE TABLE IF NOT EXISTS public.product_combinations (
    id TEXT PRIMARY KEY DEFAULT ('comb_' || uuid_generate_v4()),
    product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    related_product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    -- Prevent duplicate combinations
    UNIQUE(product_id, related_product_id)
);

-- Enable Row Level Security
ALTER TABLE public.product_combinations ENABLE ROW LEVEL SECURITY;

-- Policies
-- Policies
-- Allow anyone to read combinations (needed for storefront)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'product_combinations' 
        AND policyname = 'Allow public read access for product combinations'
    ) THEN
        CREATE POLICY "Allow public read access for product combinations"
        ON public.product_combinations FOR SELECT
        TO public
        USING (true);
    END IF;
END $$;

-- Allow authenticated users (Admins) to manage combinations
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'product_combinations' 
        AND policyname = 'Allow authenticated users to insert product combinations'
    ) THEN
        CREATE POLICY "Allow authenticated users to insert product combinations"
        ON public.product_combinations FOR INSERT
        TO authenticated
        WITH CHECK (true);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'product_combinations' 
        AND policyname = 'Allow authenticated users to update product combinations'
    ) THEN
        CREATE POLICY "Allow authenticated users to update product combinations"
        ON public.product_combinations FOR UPDATE
        TO authenticated
        USING (true);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'product_combinations' 
        AND policyname = 'Allow authenticated users to delete product combinations'
    ) THEN
        CREATE POLICY "Allow authenticated users to delete product combinations"
        ON public.product_combinations FOR DELETE
        TO authenticated
        USING (true);
    END IF;
END $$;

-- Comment for documentation
COMMENT ON TABLE public.product_combinations IS 'Stores manually selected product relationships for "Frequently Bought Together" feature.';
