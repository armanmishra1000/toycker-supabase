-- ==============================================
-- RBAC (Role-Based Access Control) System
-- ==============================================

-- 1. Create admin_roles table
CREATE TABLE IF NOT EXISTS admin_roles (
    id TEXT PRIMARY KEY DEFAULT ('role_' || uuid_generate_v4()),
    name TEXT NOT NULL UNIQUE,
    permissions JSONB NOT NULL DEFAULT '[]',
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Seed default system roles
INSERT INTO admin_roles (name, permissions, is_system) VALUES
    ('Owner', '["*"]', true),
    ('Admin', '["orders:*", "products:*", "inventory:*", "customers:read", "team:manage", "settings:read"]', true),
    ('Staff', '["orders:read", "orders:update", "products:read", "inventory:read", "customers:read"]', true)
ON CONFLICT (name) DO NOTHING;

-- 3. Add admin_role_id column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS admin_role_id TEXT REFERENCES admin_roles(id);

-- 4. Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_admin_role_id ON profiles(admin_role_id);

-- 5. Enable RLS on admin_roles
ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;

-- 6. Allow public read access to admin_roles (permissions checked in app layer)
CREATE POLICY "Public read admin_roles" ON admin_roles 
    FOR SELECT TO public USING (true);

-- 7. Admin-only write access via service role
-- Note: Write operations for admin_roles are done via service role in the app
