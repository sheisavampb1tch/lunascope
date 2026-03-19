create extension if not exists pgcrypto;

create table if not exists public.market_snapshots (
  condition_id text primary key,
  market_id text not null,
  question text not null,
  slug text,
  category text,
  end_date timestamptz,
  market_probability double precision not null,
  probability_source text not null,
  liquidity double precision not null default 0,
  liquidity_clob double precision not null default 0,
  volume_24hr double precision not null default 0,
  volume_1wk double precision not null default 0,
  volume_clob double precision not null default 0,
  open_interest double precision not null default 0,
  best_bid double precision,
  best_ask double precision,
  spread double precision,
  last_trade_price double precision,
  active boolean not null default true,
  accepting_orders boolean not null default true,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists market_snapshots_updated_at_idx
  on public.market_snapshots (updated_at desc);

create index if not exists market_snapshots_category_idx
  on public.market_snapshots (category);

create table if not exists public.signals (
  id uuid primary key default gen_random_uuid(),
  condition_id text not null,
  market_id text not null,
  signal text not null,
  side text not null,
  priority double precision not null,
  confidence double precision not null,
  edge double precision not null,
  absolute_edge double precision not null,
  scorer text not null,
  signal_window timestamptz not null,
  question text not null,
  category text,
  reasons jsonb not null default '[]'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create unique index if not exists signals_condition_window_uidx
  on public.signals (condition_id, signal_window);

create index if not exists signals_created_at_idx
  on public.signals (created_at desc);

create index if not exists signals_priority_idx
  on public.signals (priority desc);
