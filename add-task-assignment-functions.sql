-- add-task-assignment-functions.sql

-- This function finds a single available task for a given worker.
-- It prioritizes tasks that are funded and have not yet reached their required number of workers.
-- It also ensures the requesting worker is not the creator and has not already been assigned to the task.

create or replace function find_available_task(requesting_worker_id uuid)
returns tasks
language plpgsql
as $$
declare
    available_task tasks;
begin
    select t.*
    into available_task
    from tasks t
    left join submissions s on t.id = s.task_id
    where t.status = 'FUNDED'
      and t.creator_id <> requesting_worker_id
      -- Ensure the worker is not already assigned to this task
      and not exists (
          select 1 from submissions s_check
          where s_check.task_id = t.id and s_check.worker_id = requesting_worker_id
      )
    group by t.id
    -- Ensure the task still needs workers
    having count(s.id) < t.required_workers
    order by t.created_at asc -- Prioritize older tasks first
    limit 1;

    return available_task;
end;
$$;

-- Example of how to call it:
-- select * from find_available_task('your-worker-uuid');
