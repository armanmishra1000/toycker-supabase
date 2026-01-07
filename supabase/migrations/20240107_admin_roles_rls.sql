-- Add RLS policies for Admins to manage roles
-- Uses the is_admin() function from 20251231_admin_profiles_rls.sql

-- Allow admins to insert new roles
DROP POLICY IF EXISTS "Admins can insert admin_roles" ON public.admin_roles;
CREATE POLICY "Admins can insert admin_roles" ON public.admin_roles
    FOR INSERT TO authenticated
    WITH CHECK (is_admin());

-- Allow admins to update roles
DROP POLICY IF EXISTS "Admins can update admin_roles" ON public.admin_roles;
CREATE POLICY "Admins can update admin_roles" ON public.admin_roles
    FOR UPDATE TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

-- Allow admins to delete roles
DROP POLICY IF EXISTS "Admins can delete admin_roles" ON public.admin_roles;
CREATE POLICY "Admins can delete admin_roles" ON public.admin_roles
    FOR DELETE TO authenticated
    USING (is_admin());
