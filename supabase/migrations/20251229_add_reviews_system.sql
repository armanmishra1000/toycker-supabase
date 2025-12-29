-- Create reviews table
create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  product_id text not null,
  user_id uuid references auth.users(id),
  rating integer not null check (rating >= 1 and rating <= 5),
  title text,
  content text,
  approval_status text check (approval_status in ('pending', 'approved', 'rejected')) default 'pending',
  is_anonymous boolean default false,
  display_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create review_media table
create table if not exists review_media (
  id uuid primary key default gen_random_uuid(),
  review_id uuid references reviews(id) on delete cascade,
  file_path text not null,
  file_type text check (file_type in ('image', 'video', 'audio')),
  storage_provider text default 'r2',
  created_at timestamptz default now()
);

-- Enable RLS
alter table reviews enable row level security;
alter table review_media enable row level security;

-- Policies for reviews
create policy "Public can view approved reviews"
  on reviews for select
  using (approval_status = 'approved');

create policy "Authenticated users can create reviews"
  on reviews for insert
  to authenticated
  with check (true);

create policy "Admins can do everything on reviews"
  on reviews for all
  using (
    -- Assuming admin check is done via app or specific role, 
    -- but for now allowing service role or specific admin logic if implemented.
    -- Often in simpler setups we just rely on service_role for admin tasks, 
    -- or check a profile role. For now, I'll allow service_role key to bypass, 
    -- and maybe add a check for admin profile if that system exists.
    -- Given the user context "Admins can view/edit/delete", I'll check if there is an is_admin flag.
    -- Checking profiles table commonly used in this project.
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Policies for review_media
create policy "Public can view review media"
  on review_media for select
  using (true);

create policy "Authenticated users can upload review media"
  on review_media for insert
  to authenticated
  with check (true);

create policy "Admins can manage review media"
  on review_media for all
  using (
     exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );
