alter table public.profiles enable row level security;
alter table public.users enable row level security;
alter table public.task_types enable row level security;
alter table public.tasks enable row level security;
alter table public.task_assignments enable row level security;
alter table public.notifications enable row level security;
alter table public.transactions enable row level security;
alter table public.withdrawal_requests enable row level security;
alter table public.compute_sessions enable row level security;
alter table public.compute_results enable row level security;
alter table public.education_fund_stats enable row level security;

-- Permissive bootstrap policies (adjust for production)

drop policy if exists "profiles_select_all" on public.profiles;
create policy "profiles_select_all" on public.profiles for select using (true);
drop policy if exists "profiles_insert_all" on public.profiles;
create policy "profiles_insert_all" on public.profiles for insert with check (true);
drop policy if exists "profiles_update_all" on public.profiles;
create policy "profiles_update_all" on public.profiles for update using (true) with check (true);

drop policy if exists "users_select_all" on public.users;
create policy "users_select_all" on public.users for select using (true);
drop policy if exists "users_insert_all" on public.users;
create policy "users_insert_all" on public.users for insert with check (true);
drop policy if exists "users_update_all" on public.users;
create policy "users_update_all" on public.users for update using (true) with check (true);

drop policy if exists "task_types_select_all" on public.task_types;
create policy "task_types_select_all" on public.task_types for select using (true);

drop policy if exists "tasks_select_all" on public.tasks;
create policy "tasks_select_all" on public.tasks for select using (true);
drop policy if exists "tasks_insert_all" on public.tasks;
create policy "tasks_insert_all" on public.tasks for insert with check (true);
drop policy if exists "tasks_update_all" on public.tasks;
create policy "tasks_update_all" on public.tasks for update using (true) with check (true);

drop policy if exists "task_assignments_select_all" on public.task_assignments;
create policy "task_assignments_select_all" on public.task_assignments for select using (true);
drop policy if exists "task_assignments_insert_all" on public.task_assignments;
create policy "task_assignments_insert_all" on public.task_assignments for insert with check (true);
drop policy if exists "task_assignments_update_all" on public.task_assignments;
create policy "task_assignments_update_all" on public.task_assignments for update using (true) with check (true);

drop policy if exists "notifications_select_all" on public.notifications;
create policy "notifications_select_all" on public.notifications for select using (true);
drop policy if exists "notifications_insert_all" on public.notifications;
create policy "notifications_insert_all" on public.notifications for insert with check (true);
drop policy if exists "notifications_update_all" on public.notifications;
create policy "notifications_update_all" on public.notifications for update using (true) with check (true);

drop policy if exists "transactions_select_all" on public.transactions;
create policy "transactions_select_all" on public.transactions for select using (true);
drop policy if exists "transactions_insert_all" on public.transactions;
create policy "transactions_insert_all" on public.transactions for insert with check (true);

drop policy if exists "withdrawals_select_all" on public.withdrawal_requests;
create policy "withdrawals_select_all" on public.withdrawal_requests for select using (true);
drop policy if exists "withdrawals_insert_all" on public.withdrawal_requests;
create policy "withdrawals_insert_all" on public.withdrawal_requests for insert with check (true);
drop policy if exists "withdrawals_update_all" on public.withdrawal_requests;
create policy "withdrawals_update_all" on public.withdrawal_requests for update using (true) with check (true);

drop policy if exists "compute_sessions_select_all" on public.compute_sessions;
create policy "compute_sessions_select_all" on public.compute_sessions for select using (true);
drop policy if exists "compute_sessions_insert_all" on public.compute_sessions;
create policy "compute_sessions_insert_all" on public.compute_sessions for insert with check (true);
drop policy if exists "compute_sessions_update_all" on public.compute_sessions;
create policy "compute_sessions_update_all" on public.compute_sessions for update using (true) with check (true);

drop policy if exists "compute_results_select_all" on public.compute_results;
create policy "compute_results_select_all" on public.compute_results for select using (true);
drop policy if exists "compute_results_insert_all" on public.compute_results;
create policy "compute_results_insert_all" on public.compute_results for insert with check (true);

drop policy if exists "education_fund_stats_select_all" on public.education_fund_stats;
create policy "education_fund_stats_select_all" on public.education_fund_stats for select using (true);
drop policy if exists "education_fund_stats_update_all" on public.education_fund_stats;
create policy "education_fund_stats_update_all" on public.education_fund_stats for update using (true) with check (true);
