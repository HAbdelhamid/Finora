-- Finora sync v1: run in the Supabase SQL editor after reviewing your project.
-- Reuses finance_workspaces created by supabase/schema.sql. Never store provider secrets here.
alter table public.finance_workspaces add column if not exists revision bigint not null default 1;
create index if not exists finance_workspaces_user_updated_idx on public.finance_workspaces (user_id, updated_at desc);
alter table public.finance_workspaces enable row level security;

-- A user's workspace is accessible only to that logged-in user.
drop policy if exists "workspace_select_self" on public.finance_workspaces;
create policy "workspace_select_self" on public.finance_workspaces for select to authenticated
  using ((select auth.uid()) = user_id);

-- Revoke direct writes: all mutations must use revision-checked RPC.
revoke insert, update, delete on public.finance_workspaces from authenticated, anon, public;
grant select on public.finance_workspaces to authenticated;
revoke all on public.finance_workspaces from anon;

create or replace function public.finance_commit_snapshot(
  expected_revision bigint,
  payload jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  requester uuid := auth.uid();
  stored_revision bigint;
  next_revision bigint;
begin
  if requester is null then
    raise exception 'Sign-in required' using errcode = '28000';
  end if;
  if payload is null or jsonb_typeof(payload) <> 'object' or octet_length(payload::text) > 2097152 then
    raise exception 'Invalid or oversized finance snapshot' using errcode = '22023';
  end if;
  if expected_revision is null or expected_revision < 0 then
    raise exception 'Invalid expected revision' using errcode = '22023';
  end if;

  select revision into stored_revision
  from public.finance_workspaces where user_id = requester
  for update;
  if not found then
    if expected_revision <> 0 then
      return jsonb_build_object('ok', false, 'conflict', true, 'revision', 0);
    end if;
    insert into public.finance_workspaces (user_id, data, revision, updated_at)
      values (requester, payload, 1, now())
      on conflict (user_id) do nothing;
    if not found then
      return jsonb_build_object('ok', false, 'conflict', true);
    end if;
    return jsonb_build_object('ok', true, 'revision', 1);
  end if;

  if stored_revision <> expected_revision then
    return jsonb_build_object('ok', false, 'conflict', true, 'revision', stored_revision);
  end if;
  next_revision := stored_revision + 1;
  update public.finance_workspaces
    set data = payload, revision = next_revision, updated_at = now()
    where user_id = requester;
  return jsonb_build_object('ok', true, 'revision', next_revision);
end;
$$;

revoke all on function public.finance_commit_snapshot(bigint,jsonb) from public, anon;
grant execute on function public.finance_commit_snapshot(bigint,jsonb) to authenticated;

-- IMPORTANT: This schema is intended for a dedicated Supabase project.
-- Confirm there are no other legacy write clients before revoking permissions.
