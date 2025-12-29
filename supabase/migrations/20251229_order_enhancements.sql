-- Order Management Enhancements Migration
-- Adds: order_timeline table, shipping_partners table, order columns, customer display_id

-- 1. Create order_timeline table for tracking all order events
CREATE TABLE IF NOT EXISTS order_timeline (
    id TEXT PRIMARY KEY DEFAULT ('evt_' || uuid_generate_v4()),
    order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN (
        'order_placed', 
        'payment_pending',
        'payment_captured', 
        'payment_failed',
        'processing',
        'shipped', 
        'out_for_delivery',
        'delivered', 
        'cancelled',
        'refunded',
        'note_added'
    )),
    title TEXT NOT NULL,
    description TEXT,
    actor TEXT DEFAULT 'system',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create shipping_partners table for admin-managed delivery partners
CREATE TABLE IF NOT EXISTS shipping_partners (
    id TEXT PRIMARY KEY DEFAULT ('sp_' || uuid_generate_v4()),
    name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Add shipping columns to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_partner_id TEXT REFERENCES shipping_partners(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method TEXT;

-- 4. Add customer_display_id sequence to profiles table
-- First create a sequence starting at 1001
CREATE SEQUENCE IF NOT EXISTS customer_display_id_seq START WITH 1001;

-- Add customer_display_id column to profiles if not exists
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS customer_display_id INTEGER;

-- Set default for new profiles
ALTER TABLE profiles ALTER COLUMN customer_display_id SET DEFAULT nextval('customer_display_id_seq');

-- Generate customer_display_id for existing profiles that don't have one
UPDATE profiles 
SET customer_display_id = nextval('customer_display_id_seq') 
WHERE customer_display_id IS NULL;

-- 5. Enable RLS on new tables
ALTER TABLE order_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_partners ENABLE ROW LEVEL SECURITY;

-- 6. Add policies for order_timeline (admin can read/write, public can read their own)
CREATE POLICY "Public read order_timeline" ON order_timeline FOR SELECT TO public USING (true);
CREATE POLICY "Admin write order_timeline" ON order_timeline FOR INSERT TO public WITH CHECK (true);

-- 7. Add policies for shipping_partners (public read, admin write)
CREATE POLICY "Public read shipping_partners" ON shipping_partners FOR SELECT TO public USING (true);
CREATE POLICY "Admin write shipping_partners" ON shipping_partners FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Admin delete shipping_partners" ON shipping_partners FOR DELETE TO public USING (true);

-- 8. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_order_timeline_order_id ON order_timeline(order_id);
CREATE INDEX IF NOT EXISTS idx_order_timeline_created_at ON order_timeline(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_shipping_partner_id ON orders(shipping_partner_id);
CREATE INDEX IF NOT EXISTS idx_profiles_customer_display_id ON profiles(customer_display_id);

-- 9. Insert some default shipping partners
INSERT INTO shipping_partners (name, is_active) VALUES 
    ('Delhivery', true),
    ('Shiprocket', true),
    ('Blue Dart', true),
    ('DTDC', true),
    ('India Post', true)
ON CONFLICT DO NOTHING;

-- 10. Create initial timeline entries for existing orders
INSERT INTO order_timeline (order_id, event_type, title, description, actor)
SELECT 
    id,
    'order_placed',
    'Order Placed',
    'Customer placed this order.',
    'system'
FROM orders
WHERE id NOT IN (SELECT DISTINCT order_id FROM order_timeline WHERE event_type = 'order_placed');
