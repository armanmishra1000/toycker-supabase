-- Home Settings PostgreSQL Functions
-- Atomic operations for reordering banners and collections

-- =============================================
-- Function: reorder_home_banners
-- Purpose: Atomically reorder home banners
-- Parameters: banner_ids - Array of banner UUIDs in desired order
-- =============================================
CREATE OR REPLACE FUNCTION public.reorder_home_banners(banner_ids UUID[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  i INTEGER;
BEGIN
  -- Check if user is admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;
  
  -- Validate that all provided IDs exist
  IF array_length(banner_ids, 1) != (
    SELECT COUNT(*) 
    FROM public.home_banners 
    WHERE id = ANY(banner_ids)
  ) THEN
    RAISE EXCEPTION 'Invalid banner IDs provided';
  END IF;
  
  -- Update sort_order for each banner atomically
  FOR i IN 1..array_length(banner_ids, 1) LOOP
    UPDATE public.home_banners
    SET 
      sort_order = i - 1,
      updated_at = now()
    WHERE id = banner_ids[i];
  END LOOP;
END;
$$;

-- =============================================
-- Function: reorder_exclusive_collections
-- Purpose: Atomically reorder exclusive collections
-- Parameters: collection_ids - Array of collection UUIDs in desired order
-- =============================================
CREATE OR REPLACE FUNCTION public.reorder_exclusive_collections(collection_ids UUID[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  i INTEGER;
BEGIN
  -- Check if user is admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;
  
  -- Validate that all provided IDs exist
  IF array_length(collection_ids, 1) != (
    SELECT COUNT(*) 
    FROM public.home_exclusive_collections 
    WHERE id = ANY(collection_ids)
  ) THEN
    RAISE EXCEPTION 'Invalid collection IDs provided';
  END IF;
  
  -- Update sort_order for each collection atomically
  FOR i IN 1..array_length(collection_ids, 1) LOOP
    UPDATE public.home_exclusive_collections
    SET 
      sort_order = i - 1,
      updated_at = now()
    WHERE id = collection_ids[i];
  END LOOP;
END;
$$;

-- =============================================
-- Grant execute permissions to authenticated users
-- (RLS and is_admin() check will handle authorization)
-- =============================================
GRANT EXECUTE ON FUNCTION public.reorder_home_banners(UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reorder_exclusive_collections(UUID[]) TO authenticated;
