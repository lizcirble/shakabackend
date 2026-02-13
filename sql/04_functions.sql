-- Recreate required RPC functions safely.
-- This script drops all overloads first to avoid return-type conflicts.

do $$
declare
  fn record;
begin
  -- Drop every existing overload of handle_expired_tasks
  for fn in
    select p.oid, n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) as args
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'handle_expired_tasks'
  loop
    execute format('drop function if exists %I.%I(%s);', fn.nspname, fn.proname, fn.args);
  end loop;

  -- Drop every existing overload of find_available_task
  for fn in
    select p.oid, n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) as args
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'find_available_task'
  loop
    execute format('drop function if exists %I.%I(%s);', fn.nspname, fn.proname, fn.args);
  end loop;
end $$;

create function public.handle_expired_tasks()
returns jsonb
language plpgsql
security definer
as $$
declare
  updated_count integer := 0;
begin
  update public.tasks
  set status = 'cancelled'
  where expires_at is not null
    and expires_at < now()
    and status in ('available','assigned','in_progress');

  get diagnostics updated_count = row_count;

  return jsonb_build_object(
    'success', true,
    'updated', updated_count
  );
end;
$$;

create function public.find_available_task(requesting_worker_id uuid)
returns setof public.tasks
language sql
security definer
as $$
  select t.*
  from public.tasks t
  where t.status in ('available','FUNDED')
    and (t.client_id is null or t.client_id <> requesting_worker_id)
    and not exists (
      select 1
      from public.task_assignments ta
      where ta.task_id = t.id
        and ta.worker_id = requesting_worker_id
    )
  order by t.created_at asc
  limit 1;
$$;

grant execute on function public.handle_expired_tasks() to anon, authenticated, service_role;
grant execute on function public.find_available_task(uuid) to anon, authenticated, service_role;
