-- Profile review schema for Supabase
-- Run this in the Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.profile_reviews (
  id uuid primary key default gen_random_uuid(),
  reviewed_id uuid not null references auth.users(id) on delete cascade,
  reviewer_id uuid not null references auth.users(id) on delete cascade,
  reviewer_name text,
  rating integer not null,
  comment text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profile_reviews_unique unique (reviewed_id, reviewer_id),
  constraint profile_reviews_not_self check (reviewed_id <> reviewer_id),
  constraint profile_reviews_rating_check check (rating between 1 and 5),
  constraint profile_reviews_comment_check check (
    char_length(trim(comment)) >= 3 and char_length(comment) <= 1000
  )
);

create index if not exists idx_profile_reviews_reviewed on public.profile_reviews (reviewed_id, updated_at desc);
create index if not exists idx_profile_reviews_reviewer on public.profile_reviews (reviewer_id);

create or replace function public.set_profile_reviews_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profile_reviews_updated_at on public.profile_reviews;
create trigger trg_profile_reviews_updated_at
before update on public.profile_reviews
for each row
execute function public.set_profile_reviews_updated_at();

alter table public.profile_reviews enable row level security;

drop policy if exists "profile reviews are public" on public.profile_reviews;
create policy "profile reviews are public"
on public.profile_reviews
for select
using (true);

drop policy if exists "users can create profile reviews" on public.profile_reviews;
create policy "users can create profile reviews"
on public.profile_reviews
for insert
with check (
  auth.uid() = reviewer_id
  and reviewer_id <> reviewed_id
  and rating between 1 and 5
  and char_length(trim(comment)) >= 3
  and char_length(comment) <= 1000
);

drop policy if exists "users can update their profile reviews" on public.profile_reviews;
create policy "users can update their profile reviews"
on public.profile_reviews
for update
using (auth.uid() = reviewer_id)
with check (
  auth.uid() = reviewer_id
  and reviewer_id <> reviewed_id
  and rating between 1 and 5
  and char_length(trim(comment)) >= 3
  and char_length(comment) <= 1000
);
