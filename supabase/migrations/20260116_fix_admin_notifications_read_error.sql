-- Fix invalid column reference in admin_notifications RLS policies
-- The error "column user_id does not exist" indicates a policy is referencing a non-existent column.
-- This migration wipes all policies on the table and reapplies correct ones.

BEGIN;

-- 1. Ensure is_admin function exists and is correct
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
    user_role TEXT;
    user_admin_role_id TEXT;
BEGIN
    -- Check profiles table using 'id' (correct PK), not 'user_id'
    SELECT role, admin_role_id INTO user_role, user_admin_role_id
    FROM public.profiles
    WHERE id = auth.uid();
    
    RETURN (user_role = 'admin') OR (user_admin_role_id IS NOT NULL);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Drop ALL policies on admin_notifications to remove the broken one
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'admin_notifications'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.admin_notifications', policy_record.policyname);
    END LOOP;
END $$;

-- 3. Recreate correct policies
-- View: Only admins
CREATE POLICY "Admins can view notifications"
  ON public.admin_notifications FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Update: Only admins (e.g. marking as read)
CREATE POLICY "Admins can update notifications"
  ON public.admin_notifications FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Insert: Only admins (or triggers which bypass RLS)
CREATE POLICY "Admins can insert notifications"
  ON public.admin_notifications FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

COMMIT;
