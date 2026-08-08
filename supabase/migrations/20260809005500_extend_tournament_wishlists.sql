alter table public.tournament_wishlists
  add column if not exists completed boolean default false,
  add column if not exists diary text,
  add column if not exists diary_date date,
  add column if not exists rating integer;

alter table public.tournament_wishlists
  alter column completed set default false;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.tournament_wishlists'::regclass
      and contype = 'u'
      and conkey @> array[
        (select attnum from pg_attribute where attrelid = 'public.tournament_wishlists'::regclass and attname = 'user_id'),
        (select attnum from pg_attribute where attrelid = 'public.tournament_wishlists'::regclass and attname = 'tournament_id')
      ]::smallint[]
      and conkey <@ array[
        (select attnum from pg_attribute where attrelid = 'public.tournament_wishlists'::regclass and attname = 'user_id'),
        (select attnum from pg_attribute where attrelid = 'public.tournament_wishlists'::regclass and attname = 'tournament_id')
      ]::smallint[]
  ) then
    alter table public.tournament_wishlists
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
    where conrelid = 'public.tournament_wishlists'::regclass
      and conname = 'tournament_wishlists_rating_check'
  ) then
    alter table public.tournament_wishlists
      add constraint tournament_wishlists_rating_check
      check (rating between 1 and 5);
  end if;
end
$$;

create index if not exists tournament_wishlists_user_id_idx
  on public.tournament_wishlists (user_id);

alter table public.tournament_wishlists enable row level security;

drop policy if exists "Users can select their own tournament wishlists" on public.tournament_wishlists;
create policy "Users can select their own tournament wishlists"
  on public.tournament_wishlists
  for select
  using (user_id = auth.uid());

drop policy if exists "Users can insert their own tournament wishlists" on public.tournament_wishlists;
create policy "Users can insert their own tournament wishlists"
  on public.tournament_wishlists
  for insert
  with check (user_id = auth.uid());

drop policy if exists "Users can update their own tournament wishlists" on public.tournament_wishlists;
create policy "Users can update their own tournament wishlists"
  on public.tournament_wishlists
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "Users can delete their own tournament wishlists" on public.tournament_wishlists;
create policy "Users can delete their own tournament wishlists"
  on public.tournament_wishlists
  for delete
  using (user_id = auth.uid());
