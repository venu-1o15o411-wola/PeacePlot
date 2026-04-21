-- =============================================================================
-- PeacePlot — Question-based check-in (chat estimation) schema
-- Requirement: question_based_estimation_full_deep_requirement_v3.txt
-- All user-owned rows link to public.profiles(id) via profile_id (NOT userid text).
-- Run in Supabase SQL Editor or: supabase db push
-- =============================================================================

-- -----------------------------------------------------------------------------
-- checkin_sessions — one conversational check-in run per user
-- -----------------------------------------------------------------------------
create table if not exists public.checkin_sessions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'finished')),
  latest_stress_level text,
  latest_mood_valence text,
  latest_confidence numeric,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists checkin_sessions_profile_id_idx
  on public.checkin_sessions (profile_id);

create index if not exists checkin_sessions_profile_status_idx
  on public.checkin_sessions (profile_id, status);

comment on table public.checkin_sessions is
  'Question-based emotional check-in: session container; Edge Function owns lifecycle.';

-- -----------------------------------------------------------------------------
-- checkin_messages — visible user + assistant chat turns
-- -----------------------------------------------------------------------------
create table if not exists public.checkin_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.checkin_sessions (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists checkin_messages_session_id_idx
  on public.checkin_messages (session_id);

create index if not exists checkin_messages_profile_id_idx
  on public.checkin_messages (profile_id);

comment on table public.checkin_messages is
  'User-visible chat; assistant_message text stored with role=assistant.';

-- -----------------------------------------------------------------------------
-- checkin_analysis — hidden structured analysis per assistant turn
-- message_id = the assistant row this analysis describes (same turn as reply).
-- -----------------------------------------------------------------------------
create table if not exists public.checkin_analysis (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.checkin_sessions (id) on delete cascade,
  message_id uuid not null references public.checkin_messages (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  stress_level text,
  mood_valence text,
  energy_level text,
  confidence numeric,
  primary_sources jsonb not null default '[]'::jsonb,
  secondary_sources jsonb not null default '[]'::jsonb,
  urgency_level text,
  internal_summary text,
  profile_signals jsonb not null default '{}'::jsonb,
  recommendation_tags jsonb not null default '[]'::jsonb,
  raw_analysis jsonb,
  created_at timestamptz not null default now()
);

create index if not exists checkin_analysis_session_id_idx
  on public.checkin_analysis (session_id);

create index if not exists checkin_analysis_profile_id_idx
  on public.checkin_analysis (profile_id);

create index if not exists checkin_analysis_message_id_idx
  on public.checkin_analysis (message_id);

comment on table public.checkin_analysis is
  'Server-side only; optional raw_analysis stores full Gemini JSON for audit.';

-- -----------------------------------------------------------------------------
-- user_memory — durable long-term memory (backend promotes conservatively)
-- -----------------------------------------------------------------------------
create table if not exists public.user_memory (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  category text not null,
  key text not null,
  value text not null,
  confidence numeric not null default 0.5,
  recurrence_count integer not null default 1,
  status text not null default 'provisional' check (status in ('provisional', 'confirmed', 'stale')),
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- One row per (profile, category, key) for upsert / recurrence
create unique index if not exists user_memory_profile_category_key_uidx
  on public.user_memory (profile_id, category, key);

create index if not exists user_memory_profile_id_idx
  on public.user_memory (profile_id);

comment on table public.user_memory is
  'Durable memory; Edge Function applies recurrence / status rules.';

-- -----------------------------------------------------------------------------
-- memory_observations — raw evidence rows (before durable promotion)
-- -----------------------------------------------------------------------------
create table if not exists public.memory_observations (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  session_id uuid not null references public.checkin_sessions (id) on delete cascade,
  source_message_id uuid not null references public.checkin_messages (id) on delete cascade,
  category text not null,
  key text not null,
  value text not null,
  confidence numeric not null default 0.5,
  created_at timestamptz not null default now()
);

create index if not exists memory_observations_profile_id_idx
  on public.memory_observations (profile_id);

create index if not exists memory_observations_session_id_idx
  on public.memory_observations (session_id);

comment on table public.memory_observations is
  'Raw memory candidates tied to a source message for auditing.';

-- -----------------------------------------------------------------------------
-- recommendation_feedback — optional user actions on suggested content
-- -----------------------------------------------------------------------------
create table if not exists public.recommendation_feedback (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  session_id uuid references public.checkin_sessions (id) on delete set null,
  content_id text,
  action_type text,
  created_at timestamptz not null default now()
);

create index if not exists recommendation_feedback_profile_id_idx
  on public.recommendation_feedback (profile_id);

comment on table public.recommendation_feedback is
  'Post-handoff engagement; content_id matches app catalog ids when wired.';

-- -----------------------------------------------------------------------------
-- updated_at triggers (reuse pattern if you already have a shared function)
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists checkin_sessions_set_updated_at on public.checkin_sessions;
create trigger checkin_sessions_set_updated_at
  before update on public.checkin_sessions
  for each row execute function public.set_updated_at();

drop trigger if exists user_memory_set_updated_at on public.user_memory;
create trigger user_memory_set_updated_at
  before update on public.user_memory
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Row Level Security
-- With NO policies, anon + authenticated JWT cannot read or write these tables.
-- The Edge Function must use SUPABASE_SERVICE_ROLE_KEY (bypasses RLS).
-- To let logged-in users SELECT their own rows from Expo directly, add policies
-- like: using (profile_id = auth.uid()) on each table for select only.
-- -----------------------------------------------------------------------------
alter table public.checkin_sessions enable row level security;
alter table public.checkin_messages enable row level security;
alter table public.checkin_analysis enable row level security;
alter table public.user_memory enable row level security;
alter table public.memory_observations enable row level security;
alter table public.recommendation_feedback enable row level security;
