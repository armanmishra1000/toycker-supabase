-- 1. Create product_variants table if it doesn't exist
CREATE TABLE IF NOT EXISTS product_variants (
    id TEXT PRIMARY KEY DEFAULT ('var_' || uuid_generate_v4()),
    title TEXT NOT NULL DEFAULT 'Default Variant',
    sku TEXT,
    barcode TEXT,
    price NUMERIC NOT NULL DEFAULT 0,
    inventory_quantity INTEGER DEFAULT 100,
    manage_inventory BOOLEAN DEFAULT TRUE,
    allow_backorder BOOLEAN DEFAULT FALSE,
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    options JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create Carts Table
CREATE TABLE IF NOT EXISTS carts (
    id TEXT PRIMARY KEY DEFAULT ('cart_' || uuid_generate_v4()),
    email TEXT,
    user_id UUID,
    region_id TEXT,
    currency_code TEXT DEFAULT 'INR',
    shipping_address JSONB,
    billing_address JSONB,
    shipping_methods JSONB,
    payment_collection JSONB,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create Cart Items Table
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

-- 4. Create Orders Table
CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY DEFAULT ('ord_' || uuid_generate_v4()),
    display_id SERIAL,
    customer_email TEXT NOT NULL,
    user_id UUID,
    total_amount NUMERIC NOT NULL,
    currency_code TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    payment_status TEXT DEFAULT 'awaiting',
    fulfillment_status TEXT DEFAULT 'not_shipped',
    payu_txn_id TEXT,
    shipping_address JSONB,
    billing_address JSONB,
    items JSONB,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Enable RLS
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- 6. Add Policies (Public access for storefront demo)
CREATE POLICY "Public read variants" ON product_variants FOR SELECT TO public USING (true);
CREATE POLICY "Public access carts" ON carts FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public access cart_items" ON cart_items FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public create orders" ON orders FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Public read orders" ON orders FOR SELECT TO public USING (true);

-- 7. DATA FIX: Generate default variants for existing products that have none
INSERT INTO product_variants (product_id, title, price, inventory_quantity)
SELECT id, 'Default', 500, 50 
FROM products 
WHERE id NOT IN (SELECT product_id FROM product_variants);

-- 8. DATA FIX: Update product prices if they are 0
UPDATE products SET price = 500 WHERE price = 0;
UPDATE product_variants SET price = 500 WHERE price = 0;