-- Enable public access to task_media bucket
-- This allows workers to view task images without authentication

-- Create storage bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('task_media', 'task_media', true)
on conflict (id) do update set public = true;

-- Drop existing policies if they exist
drop policy if exists "Public read access for task media" on storage.objects;
drop policy if exists "Authenticated users can upload task media" on storage.objects;
drop policy if exists "Users can update their own task media" on storage.objects;
drop policy if exists "Users can delete their own task media" on storage.objects;

-- Allow public read access to all files in task_media bucket
create policy "Public read access for task media"
on storage.objects for select
using (bucket_id = 'task_media');

-- Allow authenticated users to upload files
create policy "Authenticated users can upload task media"
on storage.objects for insert
with check (
  bucket_id = 'task_media' 
  and auth.role() = 'authenticated'
);

-- Allow users to update their own files
create policy "Users can update their own task media"
on storage.objects for update
using (
  bucket_id = 'task_media' 
  and auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own files
create policy "Users can delete their own task media"
on storage.objects for delete
using (
  bucket_id = 'task_media' 
  and auth.uid()::text = (storage.foldername(name))[1]
);
