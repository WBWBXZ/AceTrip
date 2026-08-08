alter table public.user_wishlist
  add column if not exists completed boolean default false,
  add column if not exists diary text,
  add column if not exists diary_date date,
  add column if not exists rating integer;

alter table public.user_wishlist
  alter column completed set default false;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.user_wishlist'::regclass
      and contype = 'u'
      and conkey @> array[
        (select attnum from pg_attribute where attrelid = 'public.user_wishlist'::regclass and attname = 'user_id'),
        (select attnum from pg_attribute where attrelid = 'public.user_wishlist'::regclass and attname = 'tournament_id')
      ]::smallint[]
      and conkey <@ array[
        (select attnum from pg_attribute where attrelid = 'public.user_wishlist'::regclass and attname = 'user_id'),
        (select attnum from pg_attribute where attrelid = 'public.user_wishlist'::regclass and attname = 'tournament_id')
      ]::smallint[]
  ) then
    alter table public.user_wishlist
      add constraint tournament_wishlists_user_id_tournament_id_key
      unique (user_id, tournament_id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.user_wishlist'::regclass
      and conname = 'tournament_wishlists_rating_check'
  ) then
    alter table public.user_wishlist
      add constraint tournament_wishlists_rating_check
      check (rating between 1 and 5);
  end if;
end
$$;

create index if not exists tournament_wishlists_user_id_idx
  on public.user_wishlist (user_id);

alter table public.user_wishlist enable row level security;

drop policy if exists "Users can select their own tournament wishlists" on public.user_wishlist;
create policy "Users can select their own tournament wishlists"
  on public.user_wishlist
  for select
  using (user_id = auth.uid());

drop policy if exists "Users can insert their own tournament wishlists" on public.user_wishlist;
create policy "Users can insert their own tournament wishlists"
  on public.user_wishlist
  for insert
  with check (user_id = auth.uid());

drop policy if exists "Users can update their own tournament wishlists" on public.user_wishlist;
create policy "Users can update their own tournament wishlists"
  on public.user_wishlist
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "Users can delete their own tournament wishlists" on public.user_wishlist;
create policy "Users can delete their own tournament wishlists"
  on public.user_wishlist
  for delete
  using (user_id = auth.uid());
