-- Migration: Sync user metadata updates to profiles table
-- Date: 2026-02-17

-- 1. Create or replace the function to handle user updates
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.profiles
  SET
    first_name = COALESCE(NEW.raw_user_meta_data->>'first_name', first_name),
    last_name = COALESCE(NEW.raw_user_meta_data->>'last_name', last_name),
    phone = COALESCE(NEW.raw_user_meta_data->>'phone_number', NEW.raw_user_meta_data->>'phone', phone),
    updated_at = NOW()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

-- 2. Create the trigger for updates
-- This ensures that whenever a user's metadata is updated (e.g. via updateCustomer server action),
-- the changes are automatically reflected in the profiles table and thus the Admin Panel.
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_update();

-- 3. Backfill existing profiles to ensure they are currently in sync
UPDATE public.profiles p
SET 
  first_name = COALESCE(u.raw_user_meta_data->>'first_name', p.first_name, ''),
  last_name = COALESCE(u.raw_user_meta_data->>'last_name', p.last_name, ''),
  phone = COALESCE(u.raw_user_meta_data->>'phone_number', u.raw_user_meta_data->>'phone', p.phone, '')
FROM auth.users u
WHERE p.id = u.id;
