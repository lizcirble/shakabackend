create table if not exists public.task_types (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  description text,
  icon text,
  created_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.profiles(id) on delete cascade,
  task_type_id uuid references public.task_types(id),
  title text not null,
  description text,
  instructions text,
  payout_amount numeric not null default 0,
  estimated_time_minutes integer,
  status text not null default 'available',
  priority integer default 1,
  data jsonb,
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  worker_count integer not null default 1,
  target_countries text[] default '{}',
  media_url text,
  media_type text
);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'tasks_status_check'
  ) then
    alter table public.tasks
      add constraint tasks_status_check
      check (status in ('available','assigned','in_progress','submitted','approved','rejected','cancelled','DRAFT','FUNDED','WSA_PROCESSING','WSA_COMPLETED','WSA_FAILED'));
  end if;
exception when duplicate_object then
  null;
end $$;

create table if not exists public.task_assignments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  worker_id uuid references public.profiles(id) on delete cascade,
  worker_email text,
  status text not null default 'accepted',
  submission_data jsonb,
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  reviewed_at timestamptz,
  completed_at timestamptz,
  client_feedback text,
  retry_count integer not null default 0
);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'task_assignments_status_check'
  ) then
    alter table public.task_assignments
      add constraint task_assignments_status_check
      check (status in ('accepted','in_progress','submitted','approved','rejected','abandoned'));
  end if;
exception when duplicate_object then
  null;
end $$;

create unique index if not exists uq_task_assignments_task_worker
  on public.task_assignments(task_id, worker_id)
  where worker_id is not null;

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  message text,
  task_id uuid references public.tasks(id) on delete cascade,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  amount numeric not null,
  type text not null,
  description text,
  status text not null default 'pending',
  task_assignment_id uuid references public.task_assignments(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.withdrawal_requests (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  amount numeric not null,
  status text not null default 'pending',
  payment_method text not null default 'bank',
  created_at timestamptz not null default now()
);
