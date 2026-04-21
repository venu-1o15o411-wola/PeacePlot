-- =============================================================================
-- PeacePlot Discover foundation
-- =============================================================================

create table if not exists public.discover_daily_featured (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  day_key text not null,
  timezone text not null default 'UTC',
  items_json jsonb not null default '[]'::jsonb,
  analysis_signature text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists discover_daily_featured_profile_day_uidx
  on public.discover_daily_featured (profile_id, day_key);

create table if not exists public.discover_user_feedback (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  item_uid text not null,
  action_type text not null check (action_type in ('open', 'save', 'hide', 'not_for_me', 'complete')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists discover_user_feedback_profile_idx
  on public.discover_user_feedback (profile_id, created_at desc);

create index if not exists discover_user_feedback_item_idx
  on public.discover_user_feedback (item_uid, created_at desc);

alter table public.discover_daily_featured enable row level security;
alter table public.discover_user_feedback enable row level security;

drop trigger if exists discover_daily_featured_set_updated_at on public.discover_daily_featured;
create trigger discover_daily_featured_set_updated_at
  before update on public.discover_daily_featured
  for each row execute function public.set_updated_at();
