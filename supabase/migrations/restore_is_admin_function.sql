-- Fix is_admin() function - restore original logic
-- The admin_roles table doesn't have user_id column
-- Original function checks profiles table for role='admin' or admin_role_id

BEGIN;

-- Restore the original is_admin() function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
    user_role TEXT;
    user_admin_role_id TEXT;
BEGIN
    -- Get the current user's role and admin_role_id from profiles table
    SELECT role, admin_role_id INTO user_role, user_admin_role_id
    FROM public.profiles
    WHERE id = auth.uid();
    
    -- User is admin if they have role='admin' OR have an admin_role_id assigned
    RETURN (user_role = 'admin') OR (user_admin_role_id IS NOT NULL);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMIT;
