create table if not exists public.compute_sessions (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references public.profiles(id) on delete cascade,
  device_type text,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  total_earned numeric not null default 0,
  earnings_rate numeric not null default 0.001,
  is_active boolean not null default false
);

create table if not exists public.compute_results (
  id uuid primary key default gen_random_uuid(),
  task_id text,
  worker_id text,
  result jsonb,
  status text default 'completed',
  created_at timestamptz not null default now()
);

create table if not exists public.education_fund_stats (
  id uuid primary key default gen_random_uuid(),
  region text unique not null default 'global',
  total_raised numeric not null default 0,
  children_enrolled integer not null default 0,
  last_updated timestamptz not null default now()
);
