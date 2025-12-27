-- Create product_options table if it doesn't exist
CREATE TABLE IF NOT EXISTS product_options (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    metadata JSONB
);

-- Create product_option_values table if it doesn't exist
CREATE TABLE IF NOT EXISTS product_option_values (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    value TEXT NOT NULL,
    option_id UUID REFERENCES product_options(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    metadata JSONB
);

-- Enable Row Level Security (RLS)
ALTER TABLE product_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_option_values ENABLE ROW LEVEL SECURITY;

-- Create Policies for Public Read Access
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'product_options' AND policyname = 'Public Access to Options'
    ) THEN
        CREATE POLICY "Public Access to Options" ON product_options
            FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'product_option_values' AND policyname = 'Public Access to Option Values'
    ) THEN
        CREATE POLICY "Public Access to Option Values" ON product_option_values
            FOR SELECT USING (true);
    END IF;
END
$$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_product_options_product_id ON product_options(product_id);
CREATE INDEX IF NOT EXISTS idx_product_option_values_option_id ON product_option_values(option_id);
CREATE INDEX IF NOT EXISTS idx_product_option_values_variant_id ON product_option_values(variant_id);