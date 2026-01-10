-- Create Promotions Table
CREATE TABLE IF NOT EXISTS promotions (
    id TEXT PRIMARY KEY DEFAULT ('prom_' || uuid_generate_v4()),
    code TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL CHECK (type IN ('percentage', 'fixed', 'free_shipping')),
    value NUMERIC NOT NULL DEFAULT 0,
    min_order_amount NUMERIC DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    starts_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ends_at TIMESTAMP WITH TIME ZONE,
    max_uses INTEGER,
    used_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add promo_code to carts and orders table
ALTER TABLE carts ADD COLUMN IF NOT EXISTS promo_code TEXT REFERENCES promotions(code);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS promo_code TEXT REFERENCES promotions(code);

-- Update RLS for promotions
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;

-- Public can select active promotions (to validate codes)
DROP POLICY IF EXISTS "Public read active promotions" ON promotions;
CREATE POLICY "Public read active promotions" ON promotions
    FOR SELECT TO public
    USING (is_active = true AND (starts_at IS NULL OR starts_at <= NOW()));

-- Only admins can manage promotions
DROP POLICY IF EXISTS "Admins manage promotions" ON promotions;
CREATE POLICY "Admins manage promotions" ON promotions
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Function to increment promotion uses
CREATE OR REPLACE FUNCTION increment_promotion_uses(promo_id TEXT)
RETURNS void AS $$
BEGIN
    UPDATE promotions
    SET used_count = used_count + 1
    WHERE id = promo_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
