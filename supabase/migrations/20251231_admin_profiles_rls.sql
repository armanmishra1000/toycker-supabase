-- ==============================================
-- Fix: Allow Admins to Update Profiles for Staff Management
-- Uses SECURITY DEFINER to avoid infinite recursion
-- ==============================================

-- First, drop the problematic policies if they exist
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update profiles admin_role_id" ON profiles;

-- Create a SECURITY DEFINER function to check if current user is admin
-- This function runs with elevated privileges and bypasses RLS
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
DECLARE
    user_role TEXT;
    user_admin_role_id TEXT;
BEGIN
    -- Get the current user's role and admin_role_id
    SELECT role, admin_role_id INTO user_role, user_admin_role_id
    FROM profiles
    WHERE id = auth.uid();
    
    -- User is admin if they have role='admin' OR have an admin_role_id assigned
    RETURN (user_role = 'admin') OR (user_admin_role_id IS NOT NULL);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policy: Allow admins to read all profiles
CREATE POLICY "Admins can read all profiles" ON profiles
    FOR SELECT
    TO authenticated
    USING (
        auth.uid() = id  -- Always can read own profile
        OR is_admin()    -- Admins can read all profiles
    );

-- Policy: Allow admins to update any profile
CREATE POLICY "Admins can update any profile" ON profiles
    FOR UPDATE
    TO authenticated
    USING (
        auth.uid() = id  -- User can update own profile
        OR is_admin()    -- Admins can update any profile
    )
    WITH CHECK (
        auth.uid() = id  -- User can update own profile
        OR is_admin()    -- Admins can update any profile
    );

