-- 1. Create the Notifications Table
CREATE TABLE IF NOT EXISTS public.admin_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('order', 'user', 'review')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable RLS (Row Level Security)
-- Only admins should see these. 
-- Assuming profiles table has 'role' column.
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view notifications" 
ON public.admin_notifications 
FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

CREATE POLICY "Admins can update notifications" 
ON public.admin_notifications 
FOR UPDATE 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

-- 3. Enable Realtime
-- This allows the Next.js app to listen for new rows instantly
ALTER PUBLICATION supabase_realtime ADD TABLE admin_notifications;

-- 4. Create the Trigger Function
CREATE OR REPLACE FUNCTION public.handle_admin_notification()
RETURNS TRIGGER AS $$
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
        notify_message := 'Order #' || NEW.display_id || ' received for ' || NEW.customer_email;
        notify_metadata := jsonb_build_object('order_id', NEW.id, 'display_id', NEW.display_id);
    
    -- Handle User Signups (profiles table)
    ELSIF TG_TABLE_NAME = 'profiles' THEN
        -- Only notify on INSERT (new user)
        IF TG_OP = 'INSERT' THEN
            notify_type := 'user';
            notify_title := 'New User Registered';
            notify_message := NEW.first_name || ' ' || NEW.last_name || ' (' || NEW.email || ') joined Toycker.';
            notify_metadata := jsonb_build_object('user_id', NEW.id, 'email', NEW.email);
        ELSE
            RETURN NEW; -- Skip updates
        END IF;

    -- Handle Reviews
    ELSIF TG_TABLE_NAME = 'reviews' THEN
        notify_type := 'review';
        notify_title := 'New Review Submitted';
        notify_message := 'New ' || NEW.rating || '-star review from ' || NEW.display_name;
        notify_metadata := jsonb_build_object('review_id', NEW.id, 'product_id', NEW.product_id, 'rating', NEW.rating);
    END IF;

    -- Insert into notifications table
    INSERT INTO public.admin_notifications (type, title, message, metadata)
    VALUES (notify_type, notify_title, notify_message, notify_metadata);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Attach Triggers

-- Order Trigger
DROP TRIGGER IF EXISTS on_order_placed ON public.orders;
CREATE TRIGGER on_order_placed
    AFTER INSERT ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.handle_admin_notification();

-- User Trigger (on profiles table because we need names/emails)
DROP TRIGGER IF EXISTS on_user_signup ON public.profiles;
CREATE TRIGGER on_user_signup
    AFTER INSERT ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_admin_notification();

-- Review Trigger
DROP TRIGGER IF EXISTS on_review_submitted ON public.reviews;
CREATE TRIGGER on_review_submitted
    AFTER INSERT ON public.reviews
    FOR EACH ROW EXECUTE FUNCTION public.handle_admin_notification();
