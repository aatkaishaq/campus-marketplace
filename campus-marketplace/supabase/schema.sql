-- ============================================================
-- CAMPUS MARKETPLACE — FULL DATABASE SCHEMA
-- Run this entire file in: Supabase Dashboard → SQL Editor
-- ============================================================

-- STEP 0: Extensions
create extension if not exists "uuid-ossp";

-- STEP 1: Enable pg_cron for TTL (available in Supabase Pro)
-- If on free tier, you can skip the cron job and handle TTL
-- via a Supabase Edge Function triggered by a cron schedule.
-- create extension if not exists pg_cron;


-- ============================================================
-- ENUMS
-- ============================================================
do $$ begin
  create type product_status as enum ('available', 'pending', 'sold', 'banned');
exception
  when duplicate_object then null;
end $$;


-- ============================================================
-- TABLES
-- ============================================================

-- Categories
create table if not exists public.categories (
  id   uuid primary key default uuid_generate_v4(),
  name text not null unique
);

-- Profiles (mirrors auth.users)
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  username   text unique not null,
  avatar_url text,
  is_online  boolean not null default false,
  updated_at timestamptz not null default now()
);

-- Products
create table if not exists public.products (
  id          uuid primary key default uuid_generate_v4(),
  seller_id   uuid not null references auth.users(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  title       text not null,
  description text,
  price       numeric(12, 2) not null check (price > 0),
  image_url   text,
  status      product_status not null default 'available',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);


-- ============================================================
-- INDEXES
-- ============================================================
create index if not exists idx_products_status    on public.products(status);
create index if not exists idx_products_seller_id on public.products(seller_id);
create index if not exists idx_products_created   on public.products(created_at desc);


-- ============================================================
-- TRIGGER: Auto-update updated_at
-- ============================================================
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_products_updated on public.products;
create trigger on_products_updated
  before update on public.products
  for each row execute function public.handle_updated_at();

drop trigger if exists on_profiles_updated on public.profiles;
create trigger on_profiles_updated
  before update on public.profiles
  for each row execute function public.handle_updated_at();


-- ============================================================
-- TRIGGER: Auto-create profile on signup
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.categories enable row level security;

-- Drop existing policies to avoid conflicts on re-run
drop policy if exists "Public profiles viewable"         on public.profiles;
drop policy if exists "Users update own profile"         on public.profiles;
drop policy if exists "Public view available products"   on public.products;
drop policy if exists "Sellers view own products"        on public.products;
drop policy if exists "Sellers insert products"          on public.products;
drop policy if exists "Sellers update own products"      on public.products;
drop policy if exists "Buyers can set pending"           on public.products;
drop policy if exists "Sellers delete own products"      on public.products;
drop policy if exists "Categories viewable by all"       on public.categories;

-- PROFILES
create policy "Public profiles viewable"
  on public.profiles for select using (true);

create policy "Users update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- CATEGORIES (read-only for everyone)
create policy "Categories viewable by all"
  on public.categories for select using (true);

-- PRODUCTS — Read
create policy "Public view available products"
  on public.products for select
  using (status = 'available');

create policy "Sellers view own products"
  on public.products for select
  using (auth.uid() = seller_id);

-- PRODUCTS — Write
create policy "Sellers insert products"
  on public.products for insert
  with check (auth.uid() = seller_id);

create policy "Sellers update own products"
  on public.products for update
  using (auth.uid() = seller_id)
  with check (auth.uid() = seller_id);

-- Allow authenticated buyers to mark available items as pending
-- In production: remove this and use an Edge Function with service role instead
create policy "Buyers can set pending"
  on public.products for update
  using (
    auth.uid() is not null
    and auth.uid() != seller_id
    and status = 'available'
  )
  with check (status = 'pending');

create policy "Sellers delete own products"
  on public.products for delete
  using (auth.uid() = seller_id);


-- ============================================================
-- REALTIME: Enable broadcast for products table
-- ============================================================
alter publication supabase_realtime add table public.products;


-- ============================================================
-- SEED: Default categories
-- ============================================================
insert into public.categories (name) values
  ('Books & Notes'),
  ('Electronics'),
  ('Furniture'),
  ('Clothing'),
  ('Sports & Fitness'),
  ('Stationery'),
  ('Vehicles'),
  ('Other')
on conflict (name) do nothing;


-- ============================================================
-- TTL: Revert stale 'pending' products back to 'available'
-- Requires pg_cron extension (Supabase Pro / paid plan)
-- Uncomment when available:
-- ============================================================
-- Uncomment the lines below if you are on Supabase Pro (pg_cron available):
--
-- select cron.schedule(
--   'revert-stale-pending-products',
--   '*/10 * * * *',
--   $$
--     update public.products
--     set status = 'available'
--     where status = 'pending'
--       and updated_at < now() - interval '24 hours';
--   $$
-- );

-- FREE TIER ALTERNATIVE:
-- Create a Supabase Edge Function called "ttl-revert" with this SQL,
-- then schedule it via: Dashboard → Edge Functions → Schedule
-- Or trigger it from your app on page load as a background call.


-- ============================================================
-- DONE. Your schema is ready.
-- ============================================================
