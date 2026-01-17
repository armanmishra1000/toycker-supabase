-- Fix for "null value in column type" error in admin_notifications
-- The error happens because the trigger function tries to insert a notification but the type is NULL, 
-- or falls back to 'system' which violates the check constraint.

-- 1. Update the CHECK constraint to allow 'system' type
ALTER TABLE public.admin_notifications 
DROP CONSTRAINT IF EXISTS admin_notifications_type_check;

ALTER TABLE public.admin_notifications 
ADD CONSTRAINT admin_notifications_type_check 
CHECK (type IN ('order', 'user', 'review', 'system', 'alert'));

-- 2. Redefine the trigger function with robust type handling
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
        -- Use COALESCE for safety
        notify_message := 'Order #' || COALESCE(NEW.display_id::text, 'NEW') || ' received from ' || COALESCE(NEW.customer_email, NEW.email, 'guest');
        notify_metadata := jsonb_build_object(
            'order_id', NEW.id, 
            'display_id', NEW.display_id,
            'total', NEW.total
        );
    
    -- Handle User Signups (profiles table)
    ELSIF TG_TABLE_NAME = 'profiles' THEN
        -- Only notify on INSERT (new user)
        IF TG_OP = 'INSERT' THEN
            notify_type := 'user';
            notify_title := 'New User Registered';
            notify_message := COALESCE(NEW.first_name, '') || ' ' || COALESCE(NEW.last_name, '') || ' (' || COALESCE(NEW.email, 'no email') || ') joined Toycker.';
            notify_metadata := jsonb_build_object('user_id', NEW.id, 'email', NEW.email);
        ELSE
            RETURN NEW; -- Skip updates
        END IF;

    -- Handle Reviews
    ELSIF TG_TABLE_NAME = 'reviews' THEN
        notify_type := 'review';
        notify_title := 'New Review Submitted';
        notify_message := 'New ' || COALESCE(NEW.rating::text, '?') || '-star review from ' || COALESCE(NEW.display_name, 'Anonymous');
        notify_metadata := jsonb_build_object('review_id', NEW.id, 'product_id', NEW.product_id, 'rating', NEW.rating);
    
    -- Fallback for any other table or unexpected case
    ELSE
        notify_type := 'system';
        notify_title := 'System Event (' || TG_TABLE_NAME || ')';
        notify_message := 'Event ' || TG_OP || ' occurred on ' || TG_TABLE_NAME;
        notify_metadata := '{}'::jsonb;
    END IF;

    -- FINAL SAFETY CHECK: If type is still NULL (should not happen with logic above), force it to 'system'
    IF notify_type IS NULL THEN
        notify_type := 'system';
        notify_title := 'Unknown Event';
        notify_message := 'An unknown event occurred (Type was NULL)';
        notify_metadata := jsonb_build_object('table', TG_TABLE_NAME, 'op', TG_OP);
    END IF;

    -- Insert into notifications table
    INSERT INTO public.admin_notifications (type, title, message, metadata, created_at)
    VALUES (notify_type, notify_title, notify_message, notify_metadata, NOW());

    RETURN NEW;
END;
$$;

-- 3. Re-attach triggers to ensure they are using the correct function
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
