-- Restore rich logic for admin notifications trigger function
-- This version handles multiple tables (orders, profiles, reviews) 
-- and builds meaningful messages, while maintaining security.

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
        -- display_id is SERIAL, in AFTER INSERT it should be available
        notify_message := 'Order #' || COALESCE(NEW.display_id::text, 'NEW') || ' received for ' || COALESCE(NEW.customer_email, NEW.email, 'guest');
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
    
    -- Fallback for safety
    ELSE
        notify_type := 'system';
        notify_title := 'System Event (' || TG_TABLE_NAME || ')';
        notify_message := 'Event ' || TG_OP || ' occurred on ' || TG_TABLE_NAME;
        notify_metadata := '{}'::jsonb;
    END IF;

    -- Insert into notifications table
    INSERT INTO public.admin_notifications (type, title, message, metadata, created_at)
    VALUES (notify_type, notify_title, notify_message, notify_metadata, NOW());

    RETURN NEW;
END;
$$;

-- Re-attach triggers to ensure they are using the correct function and no conflicting definitions exist
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
