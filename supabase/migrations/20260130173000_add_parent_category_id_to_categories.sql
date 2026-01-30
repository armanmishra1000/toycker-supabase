
-- Add missing parent_category_id column to categories table in Production
-- This column is required for the self-referencing relationship
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS parent_category_id TEXT references categories(id);

-- Ensure the constraint name matches what we expect in the code
-- Note: Postgres usually auto-names it 'categories_parent_category_id_fkey', but strictly speaking we can enforce it.
-- However, standard renaming or adding usually suffices.
