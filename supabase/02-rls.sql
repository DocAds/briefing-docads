-- =====================================================================
-- Briefing DocAds — Row Level Security
-- =====================================================================
-- Estratégia: tudo bloqueado por default. Anônimos só acessam via RPC
-- (security definer). Admins autenticados têm acesso total.
-- =====================================================================

-- Habilitar RLS em todas as tabelas
alter table public.admins enable row level security;
alter table public.clients enable row level security;
alter table public.briefing_links enable row level security;
alter table public.briefings enable row level security;
alter table public.activity_log enable row level security;

-- =====================================================================
-- Helper: verificar se user é admin ativo
-- =====================================================================
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admins
    where id = auth.uid() and is_active = true
  );
$$;

-- =====================================================================
-- Policies: admins
-- =====================================================================
drop policy if exists "admins_self_read" on public.admins;
create policy "admins_self_read"
  on public.admins for select
  to authenticated
  using (id = auth.uid() or public.is_admin());

drop policy if exists "admins_owner_all" on public.admins;
create policy "admins_owner_all"
  on public.admins for all
  to authenticated
  using (
    exists (
      select 1 from public.admins
      where id = auth.uid() and role = 'owner' and is_active = true
    )
  )
  with check (
    exists (
      select 1 from public.admins
      where id = auth.uid() and role = 'owner' and is_active = true
    )
  );

-- =====================================================================
-- Policies: clients
-- =====================================================================
drop policy if exists "clients_admin_all" on public.clients;
create policy "clients_admin_all"
  on public.clients for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- =====================================================================
-- Policies: briefing_links
-- =====================================================================
drop policy if exists "links_admin_all" on public.briefing_links;
create policy "links_admin_all"
  on public.briefing_links for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- =====================================================================
-- Policies: briefings
-- =====================================================================
drop policy if exists "briefings_admin_all" on public.briefings;
create policy "briefings_admin_all"
  on public.briefings for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- =====================================================================
-- Policies: activity_log
-- =====================================================================
drop policy if exists "activity_admin_read" on public.activity_log;
create policy "activity_admin_read"
  on public.activity_log for select
  to authenticated
  using (public.is_admin());

drop policy if exists "activity_admin_insert" on public.activity_log;
create policy "activity_admin_insert"
  on public.activity_log for insert
  to authenticated
  with check (public.is_admin());
