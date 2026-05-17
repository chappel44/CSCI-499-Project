alter table public.wishlists
add column if not exists note text not null default '',
add column if not exists priority text not null default 'medium',
add column if not exists status text not null default 'watching';

alter table public.wishlists
drop constraint if exists wishlists_priority_check;

alter table public.wishlists
add constraint wishlists_priority_check
check (priority in ('low', 'medium', 'high'));

alter table public.wishlists
drop constraint if exists wishlists_status_check;

alter table public.wishlists
add constraint wishlists_status_check
check (status in ('watching', 'ready-to-buy', 'bought'));

alter table public.wishlists
drop constraint if exists wishlists_note_length_check;

alter table public.wishlists
add constraint wishlists_note_length_check
check (char_length(note) <= 120);

alter table public.wishlists enable row level security;

drop policy if exists "wishlists are publicly readable" on public.wishlists;
create policy "wishlists are publicly readable"
on public.wishlists
for select
using (true);

drop policy if exists "users can update their wishlist notes" on public.wishlists;
create policy "users can update their wishlist notes"
on public.wishlists
to authenticated
for update
using ((auth.uid())::text = (user_id)::text)
with check ((auth.uid())::text = (user_id)::text);
