-- Storage bucket for uploaded receipt/grocery photos.
-- Files are namespaced by user id: `${auth.uid()}/filename.jpg`.
-- Run after 0001_init.sql.

insert into storage.buckets (id, name, public)
values ('food-photos', 'food-photos', false)
on conflict (id) do nothing;

-- Users can read their own photos (files stored under their uid folder).
create policy "food-photos: read own"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'food-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can upload into their own folder.
create policy "food-photos: insert own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'food-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can delete their own photos.
create policy "food-photos: delete own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'food-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
