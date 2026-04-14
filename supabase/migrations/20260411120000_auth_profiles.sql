-- PeacePlot auth: profiles + userid uniqueness + signup trigger
-- Run via Supabase Dashboard → SQL Editor, or `supabase db push` when using Supabase CLI.

-- Public profile row per auth user (plan §4.4, §6.1)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  userid text not null,
  email text,
  created_at timestamptz not null default now()
);

create unique index if not exists profiles_userid_lower
  on public.profiles (lower(userid));

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

-- Inserts happen via trigger; optional manual insert from authenticated client if needed later
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Pre-signup check (anon can call)
create or replace function public.is_userid_available(p_userid text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select not exists (
    select 1
    from public.profiles
    where lower(userid) = lower(trim(p_userid))
  );
$$;

grant execute on function public.is_userid_available(text) to anon, authenticated;

-- Create profile when auth.users row is inserted (metadata.userid from signUp options.data)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_userid text;
begin
  v_userid := nullif(trim(coalesce(new.raw_user_meta_data->>'userid', '')), '');
  if v_userid is null or v_userid = '' then
    v_userid := nullif(trim(split_part(coalesce(new.email, ''), '@', 1)), '');
  end if;
  if v_userid is null or v_userid = '' then
    v_userid := 'user_' || left(replace(new.id::text, '-', ''), 12);
  end if;

  insert into public.profiles (id, userid, email)
  values (new.id, v_userid, new.email);
  return new;
exception
  when unique_violation then
    raise exception 'This user ID is already taken.';
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
