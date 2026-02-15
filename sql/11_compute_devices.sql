-- Compute devices table for enterprise aggregation
create table if not exists public.compute_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  device_name text,
  device_type text check (device_type in ('phone', 'laptop', 'desktop', 'server')),
  ram_gb numeric not null default 0,
  cpu_cores integer not null default 0,
  storage_gb numeric not null default 0,
  compute_score numeric not null default 0,
  is_active boolean not null default false,
  last_seen timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for active device queries
create index if not exists idx_compute_devices_active on public.compute_devices(is_active, last_seen);
create index if not exists idx_compute_devices_user on public.compute_devices(user_id);

-- Function to calculate compute score
create or replace function calculate_compute_score(
  p_ram_gb numeric,
  p_cpu_cores integer,
  p_storage_gb numeric
)
returns numeric as $$
begin
  return (p_ram_gb * 2) + (p_cpu_cores * 5) + (p_storage_gb * 0.05);
end;
$$ language plpgsql immutable;

-- Trigger to auto-calculate compute score
create or replace function update_compute_score()
returns trigger as $$
begin
  new.compute_score := calculate_compute_score(new.ram_gb, new.cpu_cores, new.storage_gb);
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

create trigger trigger_update_compute_score
  before insert or update of ram_gb, cpu_cores, storage_gb
  on public.compute_devices
  for each row
  execute function update_compute_score();

-- Function to get network stats (enterprise aggregation)
create or replace function get_network_stats()
returns table (
  active_nodes bigint,
  total_ram_gb numeric,
  total_cpu_cores bigint,
  total_storage_gb numeric,
  total_compute_score numeric
) as $$
begin
  return query
  select
    count(*)::bigint as active_nodes,
    coalesce(sum(ram_gb), 0) as total_ram_gb,
    coalesce(sum(cpu_cores), 0)::bigint as total_cpu_cores,
    coalesce(sum(storage_gb), 0) as total_storage_gb,
    coalesce(sum(compute_score), 0) as total_compute_score
  from public.compute_devices
  where is_active = true
    and last_seen > now() - interval '5 minutes';
end;
$$ language plpgsql;

-- RLS policies
alter table public.compute_devices enable row level security;

create policy "Users can view their own devices"
  on public.compute_devices for select
  using (auth.uid() in (select auth_id from public.profiles where id = user_id));

create policy "Users can insert their own devices"
  on public.compute_devices for insert
  with check (auth.uid() in (select auth_id from public.profiles where id = user_id));

create policy "Users can update their own devices"
  on public.compute_devices for update
  using (auth.uid() in (select auth_id from public.profiles where id = user_id));
