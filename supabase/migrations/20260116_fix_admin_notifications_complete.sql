-- Complete fix for Admin Notifications system
-- 1. Fixes "column user_id does not exist" RLS error
-- 2. Fixes "null value in column type" Trigger error
-- 3. Ensures is_admin() function is robust

BEGIN;

-- ==========================================
-- 1. UTILITIES
-- ==========================================

-- Ensure is_admin function exists and is strictly correct
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
    user_role TEXT;
    user_admin_role_id TEXT;
BEGIN
    -- Check profiles table using 'id' (correct PK)
    -- We select into variables to be safe
    SELECT role, admin_role_id INTO user_role, user_admin_role_id
    FROM public.profiles
    WHERE id = auth.uid();
    
    RETURN (user_role = 'admin') OR (user_admin_role_id IS NOT NULL);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- ==========================================
-- 2. TABLE SCHEMA & CONSTRAINTS
-- ==========================================

-- Allow 'system' and other types in the check constraint
ALTER TABLE public.admin_notifications 
DROP CONSTRAINT IF EXISTS admin_notifications_type_check;

ALTER TABLE public.admin_notifications 
ADD CONSTRAINT admin_notifications_type_check 
CHECK (type IN ('order', 'user', 'review', 'system', 'alert'));


-- ==========================================
-- 3. POLICIES (Fixes "user_id does not exist")
-- ==========================================

-- Drop ALL policies to remove any malformed ones referencing user_id
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

-- Recreate correct policies
CREATE POLICY "Admins can view notifications"
  ON public.admin_notifications FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can update notifications"
  ON public.admin_notifications FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can insert notifications"
  ON public.admin_notifications FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());


-- ==========================================
-- 4. TRIGGERS (Fixes "null value in column type")
-- ==========================================

CREATE OR REPLACE FUNCTION public.handle_admin_notification()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    notify_title TEXT;
    notify_message TEXT;
    notify_type TEXT;
    notify_metadata JSONB;
BEGIN
    -- Handle Orders
    IF TG_TABLE_NAME = 'orders' THEN
        notify_type := 'order';
        notify_title := 'New Order Placed';
        notify_message := 'Order #' || COALESCE(NEW.display_id::text, 'NEW') || ' received from ' || COALESCE(NEW.customer_email, NEW.email, 'guest');
        notify_metadata := jsonb_build_object(
            'order_id', NEW.id, 
            'display_id', NEW.display_id,
            'total', NEW.total
        );
    
    -- Handle User Signups
    ELSIF TG_TABLE_NAME = 'profiles' THEN
        IF TG_OP = 'INSERT' THEN
            notify_type := 'user';
            notify_title := 'New User Registered';
            notify_message := COALESCE(NEW.first_name, '') || ' ' || COALESCE(NEW.last_name, '') || ' (' || COALESCE(NEW.email, 'no email') || ') joined Toycker.';
            notify_metadata := jsonb_build_object('user_id', NEW.id, 'email', NEW.email);
        ELSE
            RETURN NEW; 
        END IF;

    -- Handle Reviews
    ELSIF TG_TABLE_NAME = 'reviews' THEN
        notify_type := 'review';
        notify_title := 'New Review Submitted';
        notify_message := 'New ' || COALESCE(NEW.rating::text, '?') || '-star review from ' || COALESCE(NEW.display_name, 'Anonymous');
        notify_metadata := jsonb_build_object('review_id', NEW.id, 'product_id', NEW.product_id, 'rating', NEW.rating);
    
    -- Fallback
    ELSE
        notify_type := 'system';
        notify_title := 'System Event (' || TG_TABLE_NAME || ')';
        notify_message := 'Event ' || TG_OP || ' occurred on ' || TG_TABLE_NAME;
        notify_metadata := '{}'::jsonb;
    END IF;

    -- Safety check for NULL type
    IF notify_type IS NULL THEN
        notify_type := 'system';
        notify_title := 'Unknown Event';
        notify_message := 'An unknown event occurred (Type was NULL)';
        notify_metadata := jsonb_build_object('table', TG_TABLE_NAME, 'op', TG_OP);
    END IF;

    -- Insert
    INSERT INTO public.admin_notifications (type, title, message, metadata, created_at)
    VALUES (notify_type, notify_title, notify_message, notify_metadata, NOW());

    RETURN NEW;
END;
$$;

-- Re-attach triggers intentionally to ensure they use the new function
DROP TRIGGER IF EXISTS on_order_placed ON public.orders;
CREATE TRIGGER on_order_placed
    AFTER INSERT ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.handle_admin_notification();

DROP TRIGGER IF EXISTS on_user_signup ON public.profiles;
CREATE TRIGGER on_user_signup
    AFTER INSERT ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_admin_notification();

DROP TRIGGER IF EXISTS on_review_submitted ON public.reviews;
CREATE TRIGGER on_review_submitted
    AFTER INSERT ON public.reviews
    FOR EACH ROW EXECUTE FUNCTION public.handle_admin_notification();

COMMIT;
