-- Marketplace messaging schema for Supabase
-- Run this in the Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.marketplace_conversations (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.marketplace_listings(id) on delete cascade,
  buyer_id uuid not null references auth.users(id) on delete cascade,
  seller_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_message_at timestamptz not null default now(),
  constraint marketplace_conversations_unique unique (listing_id, buyer_id, seller_id),
  constraint marketplace_conversations_buyer_not_seller check (buyer_id <> seller_id)
);

create table if not exists public.marketplace_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.marketplace_conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  sender_name text,
  body text not null,
  created_at timestamptz not null default now(),
  constraint marketplace_messages_body_check check (char_length(trim(body)) > 0 and char_length(body) <= 2000)
);

create index if not exists idx_marketplace_conversations_buyer on public.marketplace_conversations (buyer_id);
create index if not exists idx_marketplace_conversations_seller on public.marketplace_conversations (seller_id);
create index if not exists idx_marketplace_conversations_last_message_at on public.marketplace_conversations (last_message_at desc);
create index if not exists idx_marketplace_messages_conversation on public.marketplace_messages (conversation_id, created_at);

create or replace function public.set_marketplace_conversation_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_marketplace_conversations_updated_at on public.marketplace_conversations;
create trigger trg_marketplace_conversations_updated_at
before update on public.marketplace_conversations
for each row
execute function public.set_marketplace_conversation_updated_at();

alter table public.marketplace_conversations enable row level security;
alter table public.marketplace_messages enable row level security;

drop policy if exists "participants can read conversations" on public.marketplace_conversations;
create policy "participants can read conversations"
on public.marketplace_conversations
for select
using (auth.uid() = buyer_id or auth.uid() = seller_id);

drop policy if exists "participants can create conversations" on public.marketplace_conversations;
create policy "participants can create conversations"
on public.marketplace_conversations
for insert
with check (
  (auth.uid() = buyer_id or auth.uid() = seller_id)
  and buyer_id <> seller_id
);

drop policy if exists "participants can update conversations" on public.marketplace_conversations;
create policy "participants can update conversations"
on public.marketplace_conversations
for update
using (auth.uid() = buyer_id or auth.uid() = seller_id)
with check (auth.uid() = buyer_id or auth.uid() = seller_id);

drop policy if exists "participants can read messages" on public.marketplace_messages;
create policy "participants can read messages"
on public.marketplace_messages
for select
using (
  exists (
    select 1
    from public.marketplace_conversations c
    where c.id = marketplace_messages.conversation_id
      and (auth.uid() = c.buyer_id or auth.uid() = c.seller_id)
  )
);

drop policy if exists "participants can send messages" on public.marketplace_messages;
create policy "participants can send messages"
on public.marketplace_messages
for insert
with check (
  sender_id = auth.uid()
  and exists (
    select 1
    from public.marketplace_conversations c
    where c.id = marketplace_messages.conversation_id
      and (auth.uid() = c.buyer_id or auth.uid() = c.seller_id)
  )
);

