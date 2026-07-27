-- Run once in the Supabase SQL editor: creates a public media bucket
-- that staff can upload to and anyone can view.
insert into storage.buckets (id, name, public) values ('org-media','org-media', true)
on conflict (id) do nothing;
drop policy if exists "org media public read" on storage.objects;
create policy "org media public read" on storage.objects
  for select using (bucket_id = 'org-media');
drop policy if exists "org media staff insert" on storage.objects;
create policy "org media staff insert" on storage.objects
  for insert with check (bucket_id = 'org-media' and public.is_staff());
drop policy if exists "org media staff update" on storage.objects;
create policy "org media staff update" on storage.objects
  for update using (bucket_id = 'org-media' and public.is_staff());
drop policy if exists "org media staff delete" on storage.objects;
create policy "org media staff delete" on storage.objects
  for delete using (bucket_id = 'org-media' and public.is_staff());
