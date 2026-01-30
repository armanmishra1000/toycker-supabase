-- Add image_url column to categories and collections
ALTER TABLE categories ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE collections ADD COLUMN IF NOT EXISTS image_url TEXT;
