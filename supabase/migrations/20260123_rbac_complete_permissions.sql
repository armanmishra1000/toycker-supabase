-- ================================================
-- RBAC: Complete Permission System
-- Adds all missing permissions for granular access control
-- Creates helper functions for efficient permission checking
-- ================================================

-- ================================================
-- PART 1: Update System Roles with Complete Permissions
-- ================================================

-- Update Owner role with full access wildcard
UPDATE public.admin_roles
SET permissions = to_jsonb(ARRAY['*']),
    updated_at = NOW()
WHERE name = 'Owner' AND is_system = true;

-- Update Admin role with comprehensive permissions (no wildcards, explicit grants)
UPDATE public.admin_roles
SET permissions = to_jsonb(ARRAY[
  -- Orders (full)
  'orders:read', 'orders:update', 'orders:delete',
  -- Products (full)
  'products:read', 'products:create', 'products:update', 'products:delete',
  -- Inventory (full)
  'inventory:read', 'inventory:update',
  -- Customers (read & update only, no delete for safety)
  'customers:read', 'customers:update',
  -- Collections (full)
  'collections:read', 'collections:create', 'collections:update', 'collections:delete',
  -- Categories (full)
  'categories:read', 'categories:create', 'categories:update', 'categories:delete',
  -- Discounts (full)
  'discounts:read', 'discounts:create', 'discounts:update', 'discounts:delete',
  -- Shipping (full)
  'shipping:read', 'shipping:create', 'shipping:update', 'shipping:delete',
  -- Shipping Partners (full)
  'shipping_partners:read', 'shipping_partners:create', 'shipping_partners:update', 'shipping_partners:delete',
  -- Payments (full)
  'payments:read', 'payments:create', 'payments:update', 'payments:delete',
  -- Reviews (read & update, no delete)
  'reviews:read', 'reviews:update',
  -- Home Settings (full)
  'home_settings:read', 'home_settings:update',
  -- Club Settings (full)
  'club_settings:read', 'club_settings:update',
  -- Settings (full)
  'settings:read', 'settings:update'
]),
    updated_at = NOW()
WHERE name = 'Admin' AND is_system = true;

-- Update Staff role with limited read/update permissions
UPDATE public.admin_roles
SET permissions = to_jsonb(ARRAY[
  -- Orders (read & update only)
  'orders:read', 'orders:update',
  -- Products (read only)
  'products:read',
  -- Inventory (read only)
  'inventory:read',
  -- Customers (read only)
  'customers:read',
  -- Collections (read only)
  'collections:read',
  -- Categories (read only)
  'categories:read',
  -- Discounts (read only)
  'discounts:read',
  -- Shipping (read only)
  'shipping:read'
]),
    updated_at = NOW()
WHERE name = 'Staff' AND is_system = true;

-- ================================================
-- PART 2: Create Permission Check Function
-- ================================================

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.has_permission(TEXT);

-- Create optimized permission check function
-- Uses SECURITY DEFINER to bypass RLS and avoid recursion
-- Supports wildcards: '*' for full access, 'resource:*' for category access
CREATE OR REPLACE FUNCTION public.has_permission(
  required_permission TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  user_permissions_jsonb JSONB;
  user_permissions TEXT[];
  category TEXT;
  category_wildcard TEXT;
BEGIN
  -- Get current user's permissions from their assigned role (as jsonb)
  SELECT ar.permissions INTO user_permissions_jsonb
  FROM profiles p
  INNER JOIN admin_roles ar ON p.admin_role_id = ar.id
  WHERE p.id = auth.uid();

  -- If user has no role assigned, deny access
  IF user_permissions_jsonb IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Convert jsonb array to text array for easier checking
  user_permissions := ARRAY(
    SELECT jsonb_array_elements_text(user_permissions_jsonb)
  );

  -- If permissions array is empty, deny access
  IF array_length(user_permissions, 1) IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Check for full access wildcard (Owner role)
  IF '*' = ANY(user_permissions) THEN
    RETURN TRUE;
  END IF;

  -- Check for exact permission match
  IF required_permission = ANY(user_permissions) THEN
    RETURN TRUE;
  END IF;

  -- Extract category from permission (e.g., 'orders' from 'orders:read')
  category := split_part(required_permission, ':', 1);
  category_wildcard := category || ':*';
  
  -- Check for category wildcard match (e.g., 'orders:*' matches 'orders:read')
  IF category_wildcard = ANY(user_permissions) THEN
    RETURN TRUE;
  END IF;

  -- No permission found, deny access
  RETURN FALSE;
END;
$$;

-- Add helpful comment
COMMENT ON FUNCTION public.has_permission IS 
  'Checks if the current authenticated user has the specified permission. 
   Supports wildcards: "*" for full access and "resource:*" for category access.
   Returns FALSE if user has no role assigned.';

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.has_permission(TEXT) TO authenticated;

-- ================================================
-- PART 3: Performance Indexes
-- ================================================

-- Index on profiles.admin_role_id for faster role lookups
CREATE INDEX IF NOT EXISTS idx_profiles_admin_role_id 
  ON public.profiles(admin_role_id) 
  WHERE admin_role_id IS NOT NULL;

-- Index on admin_roles.id for faster joins
CREATE INDEX IF NOT EXISTS idx_admin_roles_id 
  ON public.admin_roles(id);

-- GIN index on permissions array for faster containment checks
CREATE INDEX IF NOT EXISTS idx_admin_roles_permissions 
  ON public.admin_roles USING GIN(permissions);

-- ================================================
-- PART 4: Row-Level Security Policy for Critical Operations
-- ================================================

-- Example: Only allow customer deletion with explicit permission
-- This demonstrates RLS integration (can be expanded as needed)

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Only users with customers:delete can delete customers" ON public.profiles;

-- Create policy for customer deletion
CREATE POLICY "Only users with customers:delete can delete customers" 
  ON public.profiles
  FOR DELETE TO authenticated
  USING (
    -- Users can always delete their own profile
    auth.uid() = id
    OR
    -- Or admin with explicit customers:delete permission
    (SELECT has_permission('customers:delete'))
  );

-- ================================================
-- VERIFICATION
-- ================================================

-- Verify Owner role has wildcard
DO $$
DECLARE
  owner_perms JSONB;
BEGIN
  SELECT permissions INTO owner_perms 
  FROM admin_roles 
  WHERE name = 'Owner' AND is_system = true;
  
  IF NOT (owner_perms ? '*') THEN
    RAISE EXCEPTION 'Owner role does not have wildcard permission';
  END IF;
  
  RAISE NOTICE 'Owner role verified: has wildcard permission';
END $$;

-- Verify Admin role has expected permission count
DO $$
DECLARE
  admin_perm_count INT;
BEGIN
  SELECT jsonb_array_length(permissions) INTO admin_perm_count 
  FROM admin_roles 
  WHERE name = 'Admin' AND is_system = true;
  
  IF admin_perm_count < 30 THEN
    RAISE EXCEPTION 'Admin role has insufficient permissions: %', admin_perm_count;
  END IF;
  
  RAISE NOTICE 'Admin role verified: has % permissions', admin_perm_count;
END $$;

-- Verify Staff role has expected permission count
DO $$
DECLARE
  staff_perm_count INT;
BEGIN
  SELECT jsonb_array_length(permissions) INTO staff_perm_count 
  FROM admin_roles 
  WHERE name = 'Staff' AND is_system = true;
  
  IF staff_perm_count < 8 THEN
    RAISE EXCEPTION 'Staff role has insufficient permissions: %', staff_perm_count;
  END IF;
  
  RAISE NOTICE 'Staff role verified: has % permissions', staff_perm_count;
END $$;

-- Verify indexes were created
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_profiles_admin_role_id'
  ) THEN
    RAISE EXCEPTION 'Index idx_profiles_admin_role_id was not created';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_admin_roles_permissions'
  ) THEN
    RAISE EXCEPTION 'Index idx_admin_roles_permissions was not created';
  END IF;
  
  RAISE NOTICE 'All indexes verified';
END $$;

-- Display final summary
DO $$
DECLARE
  owner_perms JSONB;
  admin_perms JSONB;
  staff_perms JSONB;
BEGIN
  SELECT permissions INTO owner_perms FROM admin_roles WHERE name = 'Owner' AND is_system = true;
  SELECT permissions INTO admin_perms FROM admin_roles WHERE name = 'Admin' AND is_system = true;
  SELECT permissions INTO staff_perms FROM admin_roles WHERE name = 'Staff' AND is_system = true;
  
  RAISE NOTICE '================================================';
  RAISE NOTICE 'RBAC Migration Complete!';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'Owner permissions: % (wildcard)', jsonb_array_length(owner_perms);
  RAISE NOTICE 'Admin permissions: %', jsonb_array_length(admin_perms);
  RAISE NOTICE 'Staff permissions: %', jsonb_array_length(staff_perms);
  RAISE NOTICE '================================================';
  RAISE NOTICE 'Function created: has_permission(TEXT)';
  RAISE NOTICE 'Indexes created: 3';
  RAISE NOTICE 'RLS policies updated: 1';
  RAISE NOTICE '================================================';
END $$;
