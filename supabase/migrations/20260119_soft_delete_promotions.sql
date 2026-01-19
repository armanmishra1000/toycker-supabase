-- Add is_deleted column to promotions table
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;

-- Update RLS policies to exclude soft-deleted promotions from public view
DROP POLICY IF EXISTS "Public read active promotions" ON promotions;
CREATE POLICY "Public read active promotions" ON promotions
    FOR SELECT TO public
    USING (
        is_active = true 
        AND is_deleted = false 
        AND (starts_at IS NULL OR starts_at <= NOW())
    );

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
