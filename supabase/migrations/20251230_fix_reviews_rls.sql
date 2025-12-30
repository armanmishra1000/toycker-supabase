-- Allow users to view their own reviews (pending, approved, rejected)
-- This is necessary so that after a user inserts a review (which is pending by default),
-- they can immediately select it back to verify success or attach media.

create policy "Users can view their own reviews"
  on reviews for select
  to authenticated
  using (user_id = auth.uid());
