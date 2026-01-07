-- Migration: Add addresses table and RLS policies
-- Created to fix "schema cache" error in remote environment

CREATE TABLE IF NOT EXISTS public.addresses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name text,
  last_name text,
  company text,
  address_1 text,
  address_2 text,
  city text,
  country_code text,
  province text,
  postal_code text,
  phone text,
  metadata jsonb DEFAULT '{}'::jsonb,
  is_default_billing boolean DEFAULT false,
  is_default_shipping boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

-- Add Policies (if they don't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own addresses') THEN
        CREATE POLICY "Users can view their own addresses" ON public.addresses
          FOR SELECT USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert their own addresses') THEN
        CREATE POLICY "Users can insert their own addresses" ON public.addresses
          FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own addresses') THEN
        CREATE POLICY "Users can update their own addresses" ON public.addresses
          FOR UPDATE USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete their own addresses') THEN
        CREATE POLICY "Users can delete their own addresses" ON public.addresses
          FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;
