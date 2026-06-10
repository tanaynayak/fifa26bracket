-- ============================================================================
-- World Cup 26 Bracket — Supabase schema
-- Run this in the Supabase SQL editor (Dashboard → SQL → New query).
-- ============================================================================

-- ---- profiles -------------------------------------------------------------
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url   text,
  updated_at   timestamptz default now()
);

alter table public.profiles enable row level security;

-- Any signed-in user can read profiles (display names/avatars are not secret).
drop policy if exists "profiles are readable by authenticated users" on public.profiles;
create policy "profiles are readable by authenticated users"
  on public.profiles for select
  to authenticated using (true);

drop policy if exists "users manage their own profile" on public.profiles;
create policy "users manage their own profile"
  on public.profiles for all
  to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- Auto-create a profile row when a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---- prediction lock -------------------------------------------------------
-- 3:00 PM Eastern Time on June 11, 2026 is 19:00 UTC.
create or replace function public.predictions_are_open()
returns boolean language sql stable as $$
  select now() < timestamp with time zone '2026-06-11 19:00:00+00';
$$;

grant execute on function public.predictions_are_open() to authenticated;

-- ---- brackets -------------------------------------------------------------
create table if not exists public.brackets (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  data       jsonb not null,
  updated_at timestamptz default now()
);

alter table public.brackets enable row level security;

drop policy if exists "users manage their own bracket" on public.brackets;
drop policy if exists "users can read own bracket" on public.brackets;
create policy "users can read own bracket"
  on public.brackets for select
  to authenticated using (user_id = auth.uid());

drop policy if exists "users can insert own bracket before lock" on public.brackets;
create policy "users can insert own bracket before lock"
  on public.brackets for insert
  to authenticated with check (
    user_id = auth.uid()
    and public.predictions_are_open()
  );

drop policy if exists "users can update own bracket before lock" on public.brackets;
create policy "users can update own bracket before lock"
  on public.brackets for update
  to authenticated using (
    user_id = auth.uid()
    and public.predictions_are_open()
  ) with check (
    user_id = auth.uid()
    and public.predictions_are_open()
  );

drop policy if exists "users can delete own bracket before lock" on public.brackets;
create policy "users can delete own bracket before lock"
  on public.brackets for delete
  to authenticated using (
    user_id = auth.uid()
    and public.predictions_are_open()
  );

-- ---- leagues --------------------------------------------------------------
create table if not exists public.leagues (
  id         uuid primary key default gen_random_uuid(),
  code       text unique not null,
  name       text not null,
  owner      uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz default now()
);

alter table public.leagues enable row level security;

-- Anyone signed in may look up a league (by code) to join it.
drop policy if exists "leagues readable by authenticated users" on public.leagues;
create policy "leagues readable by authenticated users"
  on public.leagues for select to authenticated using (true);

drop policy if exists "owner can create a league" on public.leagues;
create policy "owner can create a league"
  on public.leagues for insert to authenticated with check (
    owner = auth.uid()
    and public.predictions_are_open()
  );

drop policy if exists "owner can update/delete their league" on public.leagues;
drop policy if exists "owner can update their league before lock" on public.leagues;
create policy "owner can update their league before lock"
  on public.leagues for update to authenticated
  using (
    owner = auth.uid()
    and public.predictions_are_open()
  ) with check (
    owner = auth.uid()
    and public.predictions_are_open()
  );

drop policy if exists "owner can delete their league before lock" on public.leagues;
create policy "owner can delete their league before lock"
  on public.leagues for delete to authenticated
  using (
    owner = auth.uid()
    and public.predictions_are_open()
  );

-- ---- league_members -------------------------------------------------------
create table if not exists public.league_members (
  league_id uuid not null references public.leagues (id) on delete cascade,
  user_id   uuid not null references auth.users (id) on delete cascade,
  joined_at timestamptz default now(),
  primary key (league_id, user_id)
);

alter table public.league_members enable row level security;

-- Helper avoids infinite recursion in the league_members SELECT policy.
create or replace function public.is_league_member(p_league uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.league_members
    where league_id = p_league and user_id = auth.uid()
  );
$$;

drop policy if exists "members can see co-members of their leagues" on public.league_members;
create policy "members can see co-members of their leagues"
  on public.league_members for select to authenticated
  using (public.is_league_member(league_id));

drop policy if exists "users can join (insert their own membership)" on public.league_members;
create policy "users can join (insert their own membership)"
  on public.league_members for insert to authenticated
  with check (
    user_id = auth.uid()
    and public.predictions_are_open()
  );

drop policy if exists "users can leave their own membership" on public.league_members;
create policy "users can leave their own membership"
  on public.league_members for delete to authenticated
  using (
    user_id = auth.uid()
    and public.predictions_are_open()
  );

-- Join by invite code inside the database. This avoids a dead end where an
-- account cannot read a league row yet because it is not already a member.
create or replace function public.join_league_by_code(p_code text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_league public.leagues%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Not signed in' using errcode = '28000';
  end if;

  if not public.predictions_are_open() then
    raise exception 'Predictions and leagues are locked' using errcode = 'P0001';
  end if;

  select *
    into v_league
    from public.leagues
    where code = upper(trim(p_code))
    limit 1;

  if not found then
    raise exception 'No league found with that code' using errcode = 'P0002';
  end if;

  insert into public.league_members (league_id, user_id)
  values (v_league.id, auth.uid())
  on conflict (league_id, user_id) do nothing;

  return to_jsonb(v_league);
end;
$$;

grant execute on function public.join_league_by_code(text) to authenticated;

-- Return only the leagues the current user belongs to, independent of the
-- caller's direct SELECT policy on leagues.
create or replace function public.my_leagues()
returns setof public.leagues language sql security definer stable set search_path = public as $$
  select l.*
  from public.leagues l
  join public.league_members lm on lm.league_id = l.id
  where lm.user_id = auth.uid()
  order by l.created_at;
$$;

grant execute on function public.my_leagues() to authenticated;

-- ---- cross-member visibility ----------------------------------------------
-- Let users read the brackets and profiles of people who share a league.
drop policy if exists "league co-members can read each other's brackets" on public.brackets;
create policy "league co-members can read each other's brackets"
  on public.brackets for select to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1
      from public.league_members me
      join public.league_members them on them.league_id = me.league_id
      where me.user_id = auth.uid() and them.user_id = brackets.user_id
    )
  );
