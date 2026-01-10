-- Add discount_total column to carts table
ALTER TABLE public.carts 
ADD COLUMN IF NOT EXISTS discount_total NUMERIC DEFAULT 0;

-- Verify it was added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'carts'
AND column_name = 'discount_total';
