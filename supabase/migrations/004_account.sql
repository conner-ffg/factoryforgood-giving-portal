-- ================================================================
-- ACCOUNT PAGE MIGRATION — run once in the Supabase SQL editor.
-- Safe to re-run. Adds:
--   1. profiles.avatar_url + a validated self-service profile RPC
--      (members can change their own name/photo — and nothing else;
--      role changes remain impossible from the client)
--   2. A public 'avatars' storage bucket where each user may write
--      only their own <uid>.jpg
-- ================================================================

-- ---- 1. self-service profile fields ----------------------------
alter table public.profiles add column if not exists avatar_url text;

create or replace function public.update_own_profile(new_name text default null, new_avatar text default null)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then
    raise exception 'not signed in';
  end if;
  if new_name is not null and (char_length(new_name) < 1 or char_length(new_name) > 120) then
    raise exception 'invalid name';
  end if;
  if new_avatar is not null and new_avatar <> '' and
     (char_length(new_avatar) > 500 or new_avatar !~ '^https?://') then
    raise exception 'invalid avatar url';
  end if;
  update profiles set
    full_name  = coalesce(new_name, full_name),
    avatar_url = case when new_avatar is null then avatar_url
                      when new_avatar = ''    then null
                      else new_avatar end
  where id = auth.uid();
end $$;
grant execute on function public.update_own_profile(text, text) to authenticated;

-- ---- 2. avatars bucket (public-read; owners write their own file) ----
-- Wrapped so the file still runs cleanly on databases without the
-- storage schema (e.g. local test clusters). On Supabase it applies.
do $avatars$
begin
  insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true)
  on conflict (id) do nothing;

  begin
    drop policy if exists avatars_public_read on storage.objects;
    create policy avatars_public_read on storage.objects for select
      using (bucket_id = 'avatars');
    drop policy if exists avatars_own_insert on storage.objects;
    create policy avatars_own_insert on storage.objects for insert to authenticated
      with check (bucket_id = 'avatars' and name = auth.uid()::text || '.jpg');
    drop policy if exists avatars_own_update on storage.objects;
    create policy avatars_own_update on storage.objects for update to authenticated
      using (bucket_id = 'avatars' and name = auth.uid()::text || '.jpg')
      with check (bucket_id = 'avatars' and name = auth.uid()::text || '.jpg');
    drop policy if exists avatars_own_delete on storage.objects;
    create policy avatars_own_delete on storage.objects for delete to authenticated
      using (bucket_id = 'avatars' and name = auth.uid()::text || '.jpg');
  exception when insufficient_privilege then
    raise notice 'storage.objects policies need to be created from the dashboard on this project';
  end;
exception when undefined_table then
  raise notice 'storage schema not present (non-Supabase database) — skipping bucket setup';
end $avatars$;
