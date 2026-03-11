-- Ensure profile phone sync prefers auth.users.phone over stale raw metadata.

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
    COALESCE(NULLIF(NEW.phone, ''), NEW.raw_user_meta_data->>'phone_number', NEW.raw_user_meta_data->>'phone', ''),
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$;

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
    phone = COALESCE(NULLIF(NEW.phone, ''), NEW.raw_user_meta_data->>'phone_number', NEW.raw_user_meta_data->>'phone', phone),
    updated_at = NOW()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

UPDATE public.profiles p
SET
  first_name = COALESCE(u.raw_user_meta_data->>'first_name', p.first_name, ''),
  last_name = COALESCE(u.raw_user_meta_data->>'last_name', p.last_name, ''),
  phone = COALESCE(NULLIF(u.phone, ''), u.raw_user_meta_data->>'phone_number', u.raw_user_meta_data->>'phone', p.phone, '')
FROM auth.users u
WHERE p.id = u.id;
