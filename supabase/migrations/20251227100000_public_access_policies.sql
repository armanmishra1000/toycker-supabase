-- Enable RLS on tables if not already enabled (good practice, though usually enabled by default)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;

-- Create policies to allow public (anon) and authenticated users to read data
CREATE POLICY "Allow public read access on products"
ON products FOR SELECT
TO public
USING (true);

CREATE POLICY "Allow public read access on product_variants"
ON product_variants FOR SELECT
TO public
USING (true);

CREATE POLICY "Allow public read access on categories"
ON categories FOR SELECT
TO public
USING (true);

CREATE POLICY "Allow public read access on collections"
ON collections FOR SELECT
TO public
USING (true);