-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY DEFAULT ('cat_' || uuid_generate_v4()),
    name TEXT NOT NULL,
    handle TEXT NOT NULL UNIQUE,
    description TEXT,
    parent_category_id TEXT REFERENCES categories(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create Collections Table
CREATE TABLE IF NOT EXISTS collections (
    id TEXT PRIMARY KEY DEFAULT ('col_' || uuid_generate_v4()),
    title TEXT NOT NULL,
    handle TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create Products Table
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY DEFAULT ('prod_' || uuid_generate_v4()),
    handle TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    short_description TEXT,
    price NUMERIC NOT NULL DEFAULT 0,
    currency_code TEXT NOT NULL DEFAULT 'INR',
    image_url TEXT,
    images TEXT[], -- Array of image URLs
    stock_count INTEGER DEFAULT 0,
    manage_inventory BOOLEAN DEFAULT TRUE,
    metadata JSONB DEFAULT '{}',
    category_id TEXT REFERENCES categories(id),
    collection_id TEXT REFERENCES collections(id),
    subtitle TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create Product Variants Table (This was missing)
CREATE TABLE IF NOT EXISTS product_variants (
    id TEXT PRIMARY KEY DEFAULT ('var_' || uuid_generate_v4()),
    title TEXT NOT NULL,
    sku TEXT,
    barcode TEXT,
    price NUMERIC NOT NULL DEFAULT 0,
    inventory_quantity INTEGER DEFAULT 0,
    manage_inventory BOOLEAN DEFAULT TRUE,
    allow_backorder BOOLEAN DEFAULT FALSE,
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    options JSONB DEFAULT '[]', -- Stores variant options like size/color
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create Carts Table
CREATE TABLE IF NOT EXISTS carts (
    id TEXT PRIMARY KEY DEFAULT ('cart_' || uuid_generate_v4()),
    email TEXT,
    user_id UUID, -- Links to Supabase Auth user
    region_id TEXT,
    currency_code TEXT DEFAULT 'inr',
    shipping_address JSONB,
    billing_address JSONB,
    shipping_methods JSONB,
    payment_collection JSONB,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create Cart Items Table
CREATE TABLE IF NOT EXISTS cart_items (
    id TEXT PRIMARY KEY DEFAULT ('item_' || uuid_generate_v4()),
    cart_id TEXT NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL REFERENCES products(id),
    variant_id TEXT NOT NULL REFERENCES product_variants(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Create Orders Table
CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY DEFAULT ('ord_' || uuid_generate_v4()),
    display_id SERIAL,
    customer_email TEXT NOT NULL,
    user_id UUID, -- Links to Supabase Auth user
    total_amount NUMERIC NOT NULL,
    currency_code TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    payment_status TEXT DEFAULT 'awaiting',
    fulfillment_status TEXT DEFAULT 'not_shipped',
    payu_txn_id TEXT,
    shipping_address JSONB,
    billing_address JSONB,
    items JSONB, -- Storing snapshot of items for simplicity
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Create Order Items Table (Optional relational structure)
CREATE TABLE IF NOT EXISTS order_items (
    id TEXT PRIMARY KEY DEFAULT ('ord_item_' || uuid_generate_v4()),
    order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id TEXT,
    variant_id TEXT,
    title TEXT,
    quantity INTEGER,
    unit_price NUMERIC,
    total_price NUMERIC,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Enable RLS and Policies
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Public read products" ON products FOR SELECT TO public USING (true);
CREATE POLICY "Public read variants" ON product_variants FOR SELECT TO public USING (true);
CREATE POLICY "Public read categories" ON categories FOR SELECT TO public USING (true);
CREATE POLICY "Public read collections" ON collections FOR SELECT TO public USING (true);

-- Allow cart access (Open for demo purposes, restrict in production)
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read/write carts" ON carts FOR ALL TO public USING (true) WITH CHECK (true);

ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read/write cart_items" ON cart_items FOR ALL TO public USING (true) WITH CHECK (true);