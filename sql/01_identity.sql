create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_id text unique not null,
  email text,
  full_name text,
  avatar_url text,
  reputation_score integer not null default 0,
  total_earnings numeric not null default 0,
  tasks_completed integer not null default 0,
  compute_active boolean default false,
  compute_earnings numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_profiles_auth_id on public.profiles(auth_id);

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  privy_did text unique not null,
  wallet_address text,
  is_first_task boolean not null default true,
  last_fingerprint text,
  last_login_at timestamptz,
  computes_enabled boolean not null default false,
  reputation_score integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
