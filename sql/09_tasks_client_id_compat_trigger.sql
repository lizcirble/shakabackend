-- Compatibility trigger:
-- If tasks.client_id is a users.id, convert it to the matching profiles.id
-- (via users.privy_did -> profiles.auth_id) before FK check runs.

create or replace function public.normalize_task_client_id()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_privy_did text;
  v_profile_id uuid;
begin
  if new.client_id is null then
    return new;
  end if;

  -- Already a valid profiles.id
  if exists (
    select 1
    from public.profiles p
    where p.id = new.client_id
  ) then
    return new;
  end if;

  -- Try interpreting client_id as users.id
  select u.privy_did
  into v_privy_did
  from public.users u
  where u.id = new.client_id;

  if v_privy_did is null then
    -- Not resolvable here; let FK enforce correctness.
    return new;
  end if;

  -- Resolve or create profile by auth_id
  select p.id
  into v_profile_id
  from public.profiles p
  where p.auth_id = v_privy_did
  limit 1;

  if v_profile_id is null then
    insert into public.profiles (auth_id)
    values (v_privy_did)
    returning id into v_profile_id;
  end if;

  new.client_id := v_profile_id;
  return new;
end;
$$;

drop trigger if exists trg_normalize_task_client_id on public.tasks;

create trigger trg_normalize_task_client_id
before insert or update of client_id on public.tasks
for each row

execute function public.normalize_task_client_id();
