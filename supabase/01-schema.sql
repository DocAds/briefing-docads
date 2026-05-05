-- =====================================================================
-- Briefing DocAds — Schema
-- =====================================================================
-- Execute este arquivo no SQL Editor do Supabase
-- Ordem: 01-schema.sql → 02-rls.sql → 03-functions.sql → 04-seed.sql
-- =====================================================================

-- Extensões necessárias
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- =====================================================================
-- TABELA: admins
-- Estende auth.users com metadados internos da DocAds
-- =====================================================================
create table if not exists public.admins (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null default 'admin' check (role in ('owner', 'admin', 'viewer')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_admins_active on public.admins(is_active) where is_active = true;

-- =====================================================================
-- TABELA: clients
-- Cada cliente da DocAds que vai preencher um briefing
-- =====================================================================
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  contact_name text,
  contact_email text,
  contact_phone text,
  cnpj text,
  segment text,
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'completed', 'analyzed', 'archived')),
  internal_notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_clients_status on public.clients(status);
create index if not exists idx_clients_created on public.clients(created_at desc);

-- =====================================================================
-- TABELA: briefing_links
-- Slugs únicos por cliente (link público que o cliente recebe)
-- =====================================================================
create table if not exists public.briefing_links (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  slug text unique not null,
  is_active boolean not null default true,
  expires_at timestamptz,
  access_count integer not null default 0,
  last_accessed_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_briefing_links_slug on public.briefing_links(slug) where is_active = true;
create index if not exists idx_briefing_links_client on public.briefing_links(client_id);

-- =====================================================================
-- TABELA: briefings
-- Respostas dos briefings (1 cliente pode ter N briefings — re-briefing anual)
-- =====================================================================
create table if not exists public.briefings (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  link_id uuid references public.briefing_links(id) on delete set null,
  status text not null default 'draft' check (status in ('draft', 'submitted', 'analyzed', 'archived')),
  answers jsonb not null default '{}'::jsonb,
  progress integer not null default 0 check (progress >= 0 and progress <= 100),
  current_step integer not null default 0,
  ip_address inet,
  user_agent text,
  submitted_at timestamptz,
  analyzed_at timestamptz,
  analyzed_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_briefings_client on public.briefings(client_id);
create index if not exists idx_briefings_status on public.briefings(status);
create index if not exists idx_briefings_submitted on public.briefings(submitted_at desc) where submitted_at is not null;

-- =====================================================================
-- TABELA: activity_log
-- Auditoria de eventos importantes
-- =====================================================================
create table if not exists public.activity_log (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete cascade,
  briefing_id uuid references public.briefings(id) on delete cascade,
  action text not null,
  meta jsonb,
  user_id uuid references auth.users(id),
  ip_address inet,
  created_at timestamptz not null default now()
);

create index if not exists idx_activity_client on public.activity_log(client_id, created_at desc);
create index if not exists idx_activity_action on public.activity_log(action);

-- =====================================================================
-- TRIGGER: atualizar updated_at automaticamente
-- =====================================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_admins_updated on public.admins;
create trigger trg_admins_updated
  before update on public.admins
  for each row execute function public.set_updated_at();

drop trigger if exists trg_clients_updated on public.clients;
create trigger trg_clients_updated
  before update on public.clients
  for each row execute function public.set_updated_at();

drop trigger if exists trg_briefings_updated on public.briefings;
create trigger trg_briefings_updated
  before update on public.briefings
  for each row execute function public.set_updated_at();
