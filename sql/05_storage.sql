insert into storage.buckets (id, name, public)
values ('task_media', 'task_media', true)
on conflict (id) do update set public = true;

drop policy if exists "task_media_read" on storage.objects;
create policy "task_media_read"
on storage.objects
for select
using (bucket_id = 'task_media');

drop policy if exists "task_media_insert" on storage.objects;
create policy "task_media_insert"
on storage.objects
for insert
with check (bucket_id = 'task_media');

drop policy if exists "task_media_update" on storage.objects;
create policy "task_media_update"
on storage.objects
for update
using (bucket_id = 'task_media')
with check (bucket_id = 'task_media');

drop policy if exists "task_media_delete" on storage.objects;
create policy "task_media_delete"
on storage.objects
for delete
using (bucket_id = 'task_media');
