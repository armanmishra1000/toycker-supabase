-- Junction table for product-collection many-to-many relationship
CREATE TABLE IF NOT EXISTS product_collections (
    id TEXT PRIMARY KEY DEFAULT ('pc_' || uuid_generate_v4()),
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    collection_id TEXT NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(product_id, collection_id)
);

-- Enable RLS
ALTER TABLE product_collections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read product_collections" ON product_collections FOR SELECT TO public USING (true);
CREATE POLICY "Admin manage product_collections" ON product_collections FOR ALL USING (true) WITH CHECK (true);

-- Migrate existing data from products.collection_id
-- This ensures existing product-collection relationships are preserved
INSERT INTO product_collections (product_id, collection_id)
SELECT id, collection_id FROM products WHERE collection_id IS NOT NULL
ON CONFLICT DO NOTHING;
