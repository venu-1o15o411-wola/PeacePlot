-- Add denormalized email on public.profiles (Auth still owns credentials; never store password in public schema).
-- Run in Supabase SQL Editor after 20260411120000_auth_profiles.sql.

alter table public.profiles add column if not exists email text;

-- Backfill email for existing profile rows from auth.users
update public.profiles p
set email = u.email
from auth.users u
where u.id = p.id and (p.email is null or p.email = '');

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
