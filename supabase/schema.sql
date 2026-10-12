-- Run this script in your Supabase project's SQL Editor.
-- Financial data is restricted to the owner via PostgreSQL Row Level Security.
-- Only authenticated users may read/write their workspace.
create table if not exists public.finance_workspaces (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  constraint workspace_has_object check (jsonb_typeof(data) = 'object')
);

alter table public.finance_workspaces enable row level security;
revoke all on public.finance_workspaces from anon;
grant select, insert, update, delete on public.finance_workspaces to authenticated;

drop policy if exists "workspace_select_self" on public.finance_workspaces;
create policy "workspace_select_self" on public.finance_workspaces
for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "workspace_insert_self" on public.finance_workspaces;
create policy "workspace_insert_self" on public.finance_workspaces
for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "workspace_update_self" on public.finance_workspaces;
create policy "workspace_update_self" on public.finance_workspaces
for update to authenticated using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "workspace_delete_self" on public.finance_workspaces;
create policy "workspace_delete_self" on public.finance_workspaces
for delete to authenticated using ((select auth.uid()) = user_id);

-- Optional production hardening:
-- 1. Enable MFA + bot/rate-limit protections in Supabase Auth.
-- 2. Add audit history and normalized ledger tables before large-scale use.
-- 3. Configure backups and secret rotation in your deployment pipeline.
