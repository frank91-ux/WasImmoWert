-- ============================================================
-- WasImmoWert – Supabase Database Schema
-- Run this in your Supabase SQL Editor (Dashboard → SQL)
-- ============================================================

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ─── Profiles Table ───
-- Stores user display info and settings
create table if not exists public.profiles (
  id          uuid default uuid_generate_v4() primary key,
  user_id     uuid references auth.users(id) on delete cascade not null unique,
  display_name text not null default '',
  avatar_url  text,
  settings    jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ─── Projects Table ───
-- Stores all project/property data as JSONB
create table if not exists public.projects (
  id          uuid default uuid_generate_v4() primary key,
  user_id     uuid references auth.users(id) on delete cascade not null,
  name        text not null default 'Neues Projekt',
  data        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Indexes for fast lookups
create index if not exists idx_projects_user_id on public.projects(user_id);
create index if not exists idx_projects_updated_at on public.projects(updated_at desc);
create index if not exists idx_profiles_user_id on public.profiles(user_id);

-- ─── Row Level Security (RLS) ───
-- Users can only access their own data

alter table public.profiles enable row level security;
alter table public.projects enable row level security;

-- Profiles policies
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = user_id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = user_id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = user_id);

-- Projects policies
create policy "Users can view own projects"
  on public.projects for select
  using (auth.uid() = user_id);

create policy "Users can insert own projects"
  on public.projects for insert
  with check (auth.uid() = user_id);

create policy "Users can update own projects"
  on public.projects for update
  using (auth.uid() = user_id);

create policy "Users can delete own projects"
  on public.projects for delete
  using (auth.uid() = user_id);

-- ─── Auto-create profile on signup ───
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (user_id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger: auto-create profile when a new user signs up
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── Updated_at auto-update ───
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.update_updated_at();

create trigger set_projects_updated_at
  before update on public.projects
  for each row execute procedure public.update_updated_at();

-- ─── DSGVO Data Management Extensions ───

-- Add new columns to profiles table for subscription and consent tracking
alter table public.profiles
  add column if not exists first_name text,
  add column if not exists subscription_tier text default 'free',
  add column if not exists subscription_status text default 'active',
  add column if not exists consent_analytics boolean default false,
  add column if not exists consent_marketing boolean default false,
  add column if not exists deleted_at timestamptz;

-- ─── Data Requests Table ───
-- Tracks user requests for data export and account deletion (DSGVO Articles 15 & 17)
create table if not exists public.data_requests (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  type text not null check (type in ('export', 'deletion')),
  status text default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
  request_data jsonb,
  result_url text,
  error_message text,
  created_at timestamptz default now(),
  completed_at timestamptz,
  expires_at timestamptz
);

-- Indexes for data_requests table
create index if not exists idx_data_requests_user_id on public.data_requests(user_id);
create index if not exists idx_data_requests_status on public.data_requests(status);
create index if not exists idx_data_requests_created_at on public.data_requests(created_at desc);

-- ─── Row Level Security for Data Requests ───
alter table public.data_requests enable row level security;

-- Users can view their own data requests
create policy "Users can view own data requests"
  on public.data_requests for select
  using (auth.uid() = user_id);

-- Users can create data requests for themselves
create policy "Users can create own data requests"
  on public.data_requests for insert
  with check (auth.uid() = user_id);

-- Only system can update data requests (via functions)
create policy "System only update data requests"
  on public.data_requests for update
  using (auth.uid() = user_id and false);

-- ─── Functions for Data Export and Deletion ───

-- Function to request data export (DSGVO Article 15)
create or replace function public.request_data_export()
returns uuid as $$
declare
  request_id uuid;
begin
  insert into public.data_requests (user_id, type, status)
  values (auth.uid(), 'export', 'pending')
  returning id into request_id;

  return request_id;
end;
$$ language plpgsql security definer;

-- Function to request account deletion (DSGVO Article 17)
create or replace function public.request_account_deletion()
returns uuid as $$
declare
  request_id uuid;
begin
  insert into public.data_requests (user_id, type, status)
  values (auth.uid(), 'deletion', 'pending')
  returning id into request_id;

  -- Set deletion timestamp on profile
  update public.profiles
  set deleted_at = now()
  where user_id = auth.uid();

  return request_id;
end;
$$ language plpgsql security definer;

-- Function to update user consent preferences
create or replace function public.update_consent_preferences(
  p_consent_analytics boolean,
  p_consent_marketing boolean
)
returns void as $$
begin
  update public.profiles
  set
    consent_analytics = p_consent_analytics,
    consent_marketing = p_consent_marketing,
    updated_at = now()
  where user_id = auth.uid();
end;
$$ language plpgsql security definer;

-- Function to get user's consent preferences
create or replace function public.get_consent_preferences()
returns table (
  consent_analytics boolean,
  consent_marketing boolean,
  timestamp timestamptz
) as $$
begin
  return query
  select
    profiles.consent_analytics,
    profiles.consent_marketing,
    profiles.updated_at
  from public.profiles
  where user_id = auth.uid();
end;
$$ language plpgsql security definer;

-- ─── Cleanup: Mark deleted users' data for retention period ───
-- Comments: In a real implementation, you would run a background job
-- to permanently delete marked profiles after the retention period (e.g., 90 days)
create or replace function public.cleanup_deleted_accounts()
returns table (
  deleted_count integer
) as $$
declare
  count_deleted integer;
begin
  -- Mark profiles for deletion if requested 90 days ago
  update public.profiles
  set deleted_at = now()
  where user_id in (
    select user_id from public.data_requests
    where type = 'deletion'
    and status = 'completed'
    and completed_at < now() - interval '90 days'
  );

  get diagnostics count_deleted = row_count;
  return query select count_deleted;
end;
$$ language plpgsql security definer;
