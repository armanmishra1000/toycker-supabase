-- Complete fix for admin_notifications policies
-- Drop ALL existing policies and recreate from scratch

BEGIN;

-- Drop ALL policies (there might be hidden ones from previous migrations)
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

-- Now create the correct policies
CREATE POLICY "Admins can view notifications"
  ON public.admin_notifications FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can update notifications"
  ON public.admin_notifications FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

COMMIT;

-- Verify the policies
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'admin_notifications';
