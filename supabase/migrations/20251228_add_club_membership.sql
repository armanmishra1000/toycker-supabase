-- Create Club Settings Table
CREATE TABLE IF NOT EXISTS club_settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    min_purchase_amount NUMERIC NOT NULL DEFAULT 999,
    discount_percentage INTEGER NOT NULL DEFAULT 10,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default settings row if it doesn't exist
INSERT INTO club_settings (id, min_purchase_amount, discount_percentage)
VALUES ('default', 999, 10)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE club_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access (cached on client/server)
CREATE POLICY "Public read club settings" 
ON club_settings FOR SELECT 
TO public 
USING (true);

-- Allow admin write access (handled via service role or admin check in API)
-- For simplicity in this prototype, we'll allow authenticated users to update for the admin panel
-- Ideally, you'd check for admin role here
CREATE POLICY "Authenticated update club settings" 
ON club_settings FOR UPDATE 
TO authenticated 
USING (true)
WITH CHECK (true);
