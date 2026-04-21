-- =============================================================================
-- PeacePlot Discover cache layers and catalog persistence
-- =============================================================================

create table if not exists public.discover_raw_cache (
  id uuid primary key default gen_random_uuid(),
  cache_key text not null unique,
  source text not null,
  payload_json jsonb not null,
  fetched_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create index if not exists discover_raw_cache_source_idx
  on public.discover_raw_cache (source, expires_at desc);

create table if not exists public.discover_catalog_cache (
  item_uid text primary key,
  source text not null,
  category text not null,
  tags text[] not null default '{}',
  item_json jsonb not null,
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create index if not exists discover_catalog_cache_source_category_idx
  on public.discover_catalog_cache (source, category, updated_at desc);

create table if not exists public.discover_query_cache (
  query_hash text primary key,
  category text not null,
  query_text text not null default '',
  page integer not null,
  page_size integer not null,
  item_ids jsonb not null default '[]'::jsonb,
  total_count integer not null default 0,
  has_more boolean not null default false,
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create index if not exists discover_query_cache_lookup_idx
  on public.discover_query_cache (category, query_text, page, page_size, expires_at desc);

alter table public.discover_raw_cache enable row level security;
alter table public.discover_catalog_cache enable row level security;
alter table public.discover_query_cache enable row level security;
