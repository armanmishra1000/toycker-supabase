-- Migration: Fix User Deletion (Add ON DELETE CASCADE)
-- This migration ensures that deleting a user from auth.users 
-- automatically removes associated data in other tables.
-- It also cleans up existing orphaned records to allow applying the constraints.

-- 1. Clean up orphaned records first to ensure constraints can be applied
-- This deletes records whose associated user no longer exists in auth.users
DELETE FROM public.reviews WHERE user_id IS NOT NULL AND user_id NOT IN (SELECT id FROM auth.users);
DELETE FROM public.orders WHERE user_id IS NOT NULL AND user_id NOT IN (SELECT id FROM auth.users);
DELETE FROM public.carts WHERE user_id IS NOT NULL AND user_id NOT IN (SELECT id FROM auth.users);
DELETE FROM public.profiles WHERE id NOT IN (SELECT id FROM auth.users);

-- 2. Fix Reviews table
ALTER TABLE public.reviews
DROP CONSTRAINT IF EXISTS reviews_user_id_fkey,
ADD CONSTRAINT reviews_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 3. Fix Orders table
ALTER TABLE public.orders
DROP CONSTRAINT IF EXISTS orders_user_id_fkey,
ADD CONSTRAINT orders_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 4. Fix Carts table
ALTER TABLE public.carts
DROP CONSTRAINT IF EXISTS carts_user_id_fkey,
ADD CONSTRAINT carts_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 5. Fix Profiles table
DO $$
BEGIN
    -- Drop existing foreign key on profiles if it exists
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name = 'profiles' AND constraint_name = 'profiles_id_fkey') THEN
        ALTER TABLE public.profiles DROP CONSTRAINT profiles_id_fkey;
    ELSIF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name = 'profiles' AND constraint_type = 'FOREIGN KEY') THEN
        -- If there's a foreign key with a different name, we might still want to replace it
        -- but for safety we'll just ensure our specific one is added.
        NULL;
    END IF;
    
    ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_id_fkey 
        FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not add constraint to profiles: %', SQLERRM;
END $$;
