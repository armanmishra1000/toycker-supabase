create table public.addresses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
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
  metadata jsonb default '{}'::jsonb,
  is_default_billing boolean default false,
  is_default_shipping boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.addresses enable row level security;

create policy "Users can view their own addresses" on public.addresses
  for select using (auth.uid() = user_id);

create policy "Users can insert their own addresses" on public.addresses
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own addresses" on public.addresses
  for update using (auth.uid() = user_id);

create policy "Users can delete their own addresses" on public.addresses
  for delete using (auth.uid() = user_id);