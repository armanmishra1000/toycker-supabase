-- Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create PRODUCTS table (Syncing with Medusa-like structure)
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  handle TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  short_description TEXT,
  price NUMERIC NOT NULL,
  currency_code TEXT DEFAULT 'inr',
  image_url TEXT,
  images TEXT[], -- Array of additional image URLs
  stock_count INTEGER DEFAULT 0,
  manage_inventory BOOLEAN DEFAULT TRUE,
  weight NUMERIC,
  length NUMERIC,
  height NUMERIC,
  width NUMERIC,
  hs_code TEXT,
  origin_country TEXT,
  mid_code TEXT,
  material TEXT,
  metadata JSONB,
  category_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create ORDERS table
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  display_id SERIAL,
  customer_email TEXT NOT NULL,
  total_amount NUMERIC NOT NULL,
  currency_code TEXT DEFAULT 'inr',
  status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'failed', 'shipped', 'cancelled'
  payu_txn_id TEXT UNIQUE,
  shipping_address JSONB,
  billing_address JSONB,
  shipping_method TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create ORDER_ITEMS table
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity INTEGER NOT NULL,
  unit_price NUMERIC NOT NULL,
  product_name TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create CATEGORIES table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  handle TEXT UNIQUE NOT NULL,
  description TEXT,
  parent_category_id UUID REFERENCES categories(id),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Row Level Security (RLS) Policies
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Public read access for products and categories
CREATE POLICY "Allow public read access for products" ON products FOR SELECT USING (true);
CREATE POLICY "Allow public read access for categories" ON categories FOR SELECT USING (true);

-- Authenticated users can see their own orders (based on email for now)
CREATE POLICY "Users can see their own orders" ON orders 
FOR SELECT USING (auth.jwt() ->> 'email' = customer_email);

-- Allow service role / anon (for callback) to insert orders
CREATE POLICY "Allow order insertion" ON orders FOR INSERT WITH CHECK (true);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
