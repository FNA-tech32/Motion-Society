-- Baseline cloud persistence: one JSON blob per user (single-user app → one row).
-- Run this in the Supabase SQL editor once, then set the env vars (see SETUP.md).

create table if not exists baseline_state (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Only the service-role key (used server-side by /api/state) may read/write.
-- RLS on with no policies = the anon/public key is blocked; service role bypasses it.
alter table baseline_state enable row level security;
