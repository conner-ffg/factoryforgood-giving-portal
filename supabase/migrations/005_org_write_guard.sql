-- ================================================================
-- Org write guard — makes silent data loss impossible
--
-- Problem this fixes: if a new org's INSERT ever failed (id collision
-- from a teammate adding orgs at the same time, network blip, etc.),
-- every subsequent field edit via org_set_field would UPDATE zero rows
-- and report success. The team member kept typing into a row that only
-- existed in their browser, and it vanished on the next reload.
--
-- After this migration, editing an org that is not in the database
-- raises an error, which the app surfaces as a red "NOT saved" flash.
--
-- Paste into the Supabase SQL editor and run once. Safe to re-run.
-- ================================================================

create or replace function public.org_set_field(oid int, fkey text, fval jsonb)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_staff() then
    raise exception 'staff only';
  end if;
  -- field keys are plain identifiers; anything else is a bug or an attack
  if fkey is null or fkey !~ '^[a-zA-Z_][a-zA-Z0-9_]{0,63}$' then
    raise exception 'invalid field key';
  end if;
  -- a single field never legitimately approaches this size
  if fval is not null and pg_column_size(fval) > 262144 then
    raise exception 'value too large';
  end if;
  update orgs set data = jsonb_set(data, array[fkey], coalesce(fval, 'null'::jsonb), true)
  where id = oid;
  if not found then
    raise exception 'org % is not in the database — the edit was NOT saved', oid;
  end if;
end $$;
grant execute on function public.org_set_field(int, text, jsonb) to authenticated;
