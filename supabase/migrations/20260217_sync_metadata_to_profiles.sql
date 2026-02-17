-- Migration: Sync user metadata to profiles table
-- Date: 2026-02-17

-- 1. Add missing columns to profiles table if they don't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;

-- 2. Update handle_new_user function to copy metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    first_name, 
    last_name, 
    phone,
    created_at, 
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone_number', NEW.raw_user_meta_data->>'phone', ''),
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$;

-- 3. Backfill existing profiles from auth.users (Optional but recommended)
-- Note: This requires admin privileges and usually run manually in Supabase editor.
-- UPDATE public.profiles p
-- SET 
--   first_name = COALESCE(u.raw_user_meta_data->>'first_name', ''),
--   last_name = COALESCE(u.raw_user_meta_data->>'last_name', ''),
--   phone = COALESCE(u.raw_user_meta_data->>'phone_number', u.raw_user_meta_data->>'phone', '')
-- FROM auth.users u
-- WHERE p.id = u.id;
