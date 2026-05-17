-- Marketplace saved items schema for Supabase
-- Run this in the Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.marketplace_saves (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  listing_id uuid not null references public.marketplace_listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint marketplace_saves_unique unique (user_id, listing_id)
);

create index if not exists idx_marketplace_saves_user on public.marketplace_saves (user_id, created_at desc);
create index if not exists idx_marketplace_saves_listing on public.marketplace_saves (listing_id);

alter table public.marketplace_saves enable row level security;

drop policy if exists "users can read their marketplace saves" on public.marketplace_saves;
create policy "users can read their marketplace saves"
on public.marketplace_saves
for select
using (auth.uid() = user_id);

drop policy if exists "users can create their marketplace saves" on public.marketplace_saves;
create policy "users can create their marketplace saves"
on public.marketplace_saves
for insert
with check (auth.uid() = user_id);

drop policy if exists "users can delete their marketplace saves" on public.marketplace_saves;
create policy "users can delete their marketplace saves"
on public.marketplace_saves
for delete
using (auth.uid() = user_id);
