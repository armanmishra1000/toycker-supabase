-- Fix RLS policies for reviews and review_media
-- This ensures that:
-- 1. Public can view approved reviews and all review media
-- 2. Users can always view their own reviews (needed for media upload check)
-- 3. Users can insert media for their own reviews

BEGIN;

-- 1. Reviews table policies
DROP POLICY IF EXISTS "Public can view approved reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can view their own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users create their own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Admins can do everything on reviews" ON public.reviews;

-- Allow public to see approved reviews
CREATE POLICY "Public can view approved reviews"
  ON public.reviews FOR SELECT
  USING (approval_status = 'approved');

-- Allow users to see their own reviews (even if pending/rejected)
CREATE POLICY "Users can view their own reviews"
  ON public.reviews FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Allow users to create reviews for themselves
CREATE POLICY "Users create their own reviews"
  ON public.reviews FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Admin full access
CREATE POLICY "Admins can manage reviews"
  ON public.reviews FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- 2. Review Media table policies
DROP POLICY IF EXISTS "Public can view review media" ON public.review_media;
DROP POLICY IF EXISTS "Users upload review media for their reviews" ON public.review_media;
DROP POLICY IF EXISTS "Admins can manage review media" ON public.review_media;

-- Allow everyone to view review media
CREATE POLICY "Public can view review media"
  ON public.review_media FOR SELECT
  USING (true);

-- Allow users to upload media for their own reviews
-- This relies on the "Users can view their own reviews" SELECT policy
CREATE POLICY "Users upload review media for their reviews"
  ON public.review_media FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.reviews
      WHERE id = review_id AND user_id = auth.uid()
    )
  );

-- Admin full access
CREATE POLICY "Admins can manage review media"
  ON public.review_media FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

COMMIT;
