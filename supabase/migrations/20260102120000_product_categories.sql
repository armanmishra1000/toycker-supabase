-- Create product_categories junction table
CREATE TABLE IF NOT EXISTS product_categories (
  product_id TEXT REFERENCES products(id) ON DELETE CASCADE,
  category_id TEXT REFERENCES categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (product_id, category_id)
);

-- Migrate existing data from products.category_id to the new table
INSERT INTO product_categories (product_id, category_id)
SELECT id, category_id
FROM products
WHERE category_id IS NOT NULL;

-- Make category_id on products table optional (it was likely already optional, but good to ensure)
ALTER TABLE products ALTER COLUMN category_id DROP NOT NULL;

-- (Optional) We keep category_id on products for now to avoid breaking existing queries immediately, 
-- but we should deprecate it in the future.
