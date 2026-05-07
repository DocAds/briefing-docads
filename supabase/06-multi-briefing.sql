-- =====================================================================
-- Briefing DocAds — Migration: multi-tipo (trafego + site)
-- =====================================================================
-- Adiciona suporte a multiplos tipos de briefing por cliente.
-- Idempotente: pode rodar varias vezes sem efeitos colaterais.
-- Backward-compat: registros existentes recebem briefing_type='trafego'.
-- =====================================================================
-- Ordem: 01-schema → 02-rls → 03-functions → 04-seed → 05-storage → 06-multi-briefing
-- =====================================================================

-- =====================================================================
-- 1. Adiciona coluna briefing_type em briefing_links
-- =====================================================================
alter table public.briefing_links
  add column if not exists briefing_type text not null default 'trafego';

-- Drop e recria CHECK para garantir lista atual de tipos
alter table public.briefing_links
  drop constraint if exists briefing_links_briefing_type_check;
alter table public.briefing_links
  add constraint briefing_links_briefing_type_check
  check (briefing_type in ('trafego', 'site'));

create index if not exists idx_briefing_links_type
  on public.briefing_links(briefing_type);

-- Apenas 1 link ativo por (cliente, tipo) — evita duplicar links
create unique index if not exists uniq_active_link_per_client_type
  on public.briefing_links(client_id, briefing_type)
  where is_active = true;

-- =====================================================================
-- 2. Adiciona coluna briefing_type em briefings
-- =====================================================================
alter table public.briefings
  add column if not exists briefing_type text not null default 'trafego';

alter table public.briefings
  drop constraint if exists briefings_briefing_type_check;
alter table public.briefings
  add constraint briefings_briefing_type_check
  check (briefing_type in ('trafego', 'site'));

create index if not exists idx_briefings_type
  on public.briefings(briefing_type);
create index if not exists idx_briefings_client_type
  on public.briefings(client_id, briefing_type);

-- =====================================================================
-- 3. Backfill — caso existam registros antigos sem o campo populado
-- (defensivo: o DEFAULT já cuida, mas garante consistencia)
-- =====================================================================
update public.briefing_links
  set briefing_type = 'trafego'
  where briefing_type is null;

update public.briefings
  set briefing_type = 'trafego'
  where briefing_type is null;

-- =====================================================================
-- 4. RPC: get_briefing_by_slug (atualizada — retorna briefing_type)
-- =====================================================================
create or replace function public.get_briefing_by_slug(p_slug text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_link record;
  v_client record;
  v_briefing record;
begin
  select * into v_link
  from public.briefing_links
  where slug = p_slug and is_active = true;

  if not found then
    return json_build_object('error', 'link_invalid');
  end if;

  if v_link.expires_at is not null and v_link.expires_at < now() then
    return json_build_object('error', 'link_expired');
  end if;

  select * into v_client
  from public.clients
  where id = v_link.client_id;

  -- pega o briefing mais recente DO MESMO TIPO; se for submitted, nao retorna pra edicao
  select * into v_briefing
  from public.briefings
  where client_id = v_link.client_id
    and briefing_type = v_link.briefing_type
  order by created_at desc
  limit 1;

  -- Atualiza contador de acesso
  update public.briefing_links
  set access_count = access_count + 1,
      last_accessed_at = now()
  where id = v_link.id;

  -- Marca cliente como em andamento na 1a vez que abre
  if v_client.status = 'pending' then
    update public.clients
    set status = 'in_progress', updated_at = now()
    where id = v_client.id;
  end if;

  return json_build_object(
    'link_id', v_link.id,
    'briefing_type', v_link.briefing_type,
    'client', json_build_object(
      'id', v_client.id,
      'company_name', v_client.company_name,
      'contact_name', v_client.contact_name,
      'contact_email', v_client.contact_email,
      'contact_phone', v_client.contact_phone
    ),
    'briefing', case
      when v_briefing.id is not null then
        json_build_object(
          'id', v_briefing.id,
          'status', v_briefing.status,
          'briefing_type', v_briefing.briefing_type,
          'answers', v_briefing.answers,
          'progress', v_briefing.progress,
          'current_step', v_briefing.current_step
        )
      else null
    end
  );
end;
$$;

grant execute on function public.get_briefing_by_slug(text) to anon, authenticated;

-- =====================================================================
-- 5. RPC: save_briefing_draft (scoped por briefing_type)
-- =====================================================================
create or replace function public.save_briefing_draft(
  p_slug text,
  p_answers jsonb,
  p_progress integer,
  p_current_step integer
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_link record;
  v_briefing_id uuid;
begin
  select * into v_link
  from public.briefing_links
  where slug = p_slug and is_active = true;

  if not found then
    raise exception 'link_invalid';
  end if;

  if v_link.expires_at is not null and v_link.expires_at < now() then
    raise exception 'link_expired';
  end if;

  -- procura draft existente do mesmo tipo
  select id into v_briefing_id
  from public.briefings
  where client_id = v_link.client_id
    and briefing_type = v_link.briefing_type
    and status = 'draft'
  order by created_at desc
  limit 1;

  if v_briefing_id is null then
    insert into public.briefings
      (client_id, link_id, briefing_type, answers, progress, current_step, status)
    values
      (v_link.client_id, v_link.id, v_link.briefing_type, p_answers, p_progress, p_current_step, 'draft')
    returning id into v_briefing_id;
  else
    update public.briefings
    set answers = p_answers,
        progress = p_progress,
        current_step = p_current_step,
        updated_at = now()
    where id = v_briefing_id;
  end if;

  return v_briefing_id;
end;
$$;

grant execute on function public.save_briefing_draft(text, jsonb, integer, integer) to anon, authenticated;

-- =====================================================================
-- 6. RPC: submit_briefing (scoped por briefing_type)
-- =====================================================================
create or replace function public.submit_briefing(
  p_slug text,
  p_answers jsonb
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_link record;
  v_briefing_id uuid;
  v_client record;
  v_other_active_count int;
begin
  select * into v_link
  from public.briefing_links
  where slug = p_slug and is_active = true;

  if not found then
    raise exception 'link_invalid';
  end if;

  if v_link.expires_at is not null and v_link.expires_at < now() then
    raise exception 'link_expired';
  end if;

  select * into v_client
  from public.clients
  where id = v_link.client_id;

  -- finaliza briefing do mesmo tipo
  select id into v_briefing_id
  from public.briefings
  where client_id = v_link.client_id
    and briefing_type = v_link.briefing_type
    and status = 'draft'
  order by created_at desc
  limit 1;

  if v_briefing_id is null then
    insert into public.briefings
      (client_id, link_id, briefing_type, answers, progress, current_step, status, submitted_at)
    values
      (v_link.client_id, v_link.id, v_link.briefing_type, p_answers, 100, 99, 'submitted', now())
    returning id into v_briefing_id;
  else
    update public.briefings
    set answers = p_answers,
        progress = 100,
        status = 'submitted',
        submitted_at = now(),
        updated_at = now()
    where id = v_briefing_id;
  end if;

  -- Status do cliente: completed apenas se todos os briefings ativos foram entregues.
  -- Como agora pode existir mais de 1 tipo, so marcamos completed quando nao
  -- houver mais nenhum link ativo de outro tipo aguardando preenchimento.
  select count(*) into v_other_active_count
  from public.briefing_links bl
  where bl.client_id = v_link.client_id
    and bl.id <> v_link.id
    and bl.is_active = true;

  if v_other_active_count = 0 then
    update public.clients
    set status = 'completed', updated_at = now()
    where id = v_link.client_id;
  end if;

  -- log com o tipo no meta
  insert into public.activity_log (client_id, briefing_id, action, meta)
  values (
    v_link.client_id, v_briefing_id, 'briefing_submitted',
    json_build_object(
      'company_name', v_client.company_name,
      'briefing_type', v_link.briefing_type
    )
  );

  -- desativa o link apos submissao (impede re-edicao)
  update public.briefing_links
  set is_active = false
  where id = v_link.id;

  return json_build_object(
    'briefing_id', v_briefing_id,
    'briefing_type', v_link.briefing_type,
    'client_id', v_link.client_id,
    'company_name', v_client.company_name
  );
end;
$$;

grant execute on function public.submit_briefing(text, jsonb) to anon, authenticated;

-- =====================================================================
-- 7. RPC: generate_briefing_slug (aceita tipo, prefixa pra evitar colisao)
-- =====================================================================
-- Mantemos a versao antiga (1 arg) para compat. Adicionamos a nova (2 args).
create or replace function public.generate_briefing_slug(
  p_company_name text,
  p_briefing_type text default 'trafego'
)
returns text
language plpgsql
as $$
declare
  v_base text;
  v_random text;
  v_slug text;
  v_attempts integer := 0;
  v_prefix text;
begin
  if p_briefing_type not in ('trafego', 'site') then
    raise exception 'invalid_briefing_type: %', p_briefing_type;
  end if;

  v_prefix := case p_briefing_type
    when 'site' then 'ste'
    else 'trf'
  end;

  -- Normaliza nome: lowercase, remove acentos, troca nao-alfanumerico por hifen
  v_base := lower(p_company_name);
  v_base := translate(v_base,
    'áàâãäéèêëíìîïóòôõöúùûüçñÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ',
    'aaaaaeeeeiiiiooooouuuucnaaaaaeeeeiiiiooooouuuucn');
  v_base := regexp_replace(v_base, '[^a-z0-9]+', '-', 'g');
  v_base := regexp_replace(v_base, '^-+|-+$', '', 'g');
  v_base := substring(v_base from 1 for 36);

  loop
    v_random := substring(md5(random()::text || clock_timestamp()::text) from 1 for 4);
    v_slug := v_prefix || '-' || v_base || '-' || v_random;

    if not exists (select 1 from public.briefing_links where slug = v_slug) then
      return v_slug;
    end if;

    v_attempts := v_attempts + 1;
    if v_attempts > 10 then
      raise exception 'Nao foi possivel gerar slug unico';
    end if;
  end loop;
end;
$$;

grant execute on function public.generate_briefing_slug(text, text) to authenticated;
grant execute on function public.generate_briefing_slug(text) to authenticated;

-- =====================================================================
-- 8. RPC: get_dashboard_stats (atualizada — separa por tipo)
-- =====================================================================
create or replace function public.get_dashboard_stats()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_stats json;
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;

  select json_build_object(
    'total_clients', (select count(*) from public.clients where status != 'archived'),
    'pending', (select count(*) from public.clients where status = 'pending'),
    'in_progress', (select count(*) from public.clients where status = 'in_progress'),
    'completed', (select count(*) from public.clients where status = 'completed'),
    'analyzed', (select count(*) from public.clients where status = 'analyzed'),
    'submitted_last_7d', (
      select count(*) from public.briefings
      where status = 'submitted' and submitted_at > now() - interval '7 days'
    ),
    'submitted_trafego_total', (
      select count(*) from public.briefings
      where status in ('submitted','analyzed') and briefing_type = 'trafego'
    ),
    'submitted_site_total', (
      select count(*) from public.briefings
      where status in ('submitted','analyzed') and briefing_type = 'site'
    ),
    'active_links_trafego', (
      select count(*) from public.briefing_links
      where is_active = true and briefing_type = 'trafego'
    ),
    'active_links_site', (
      select count(*) from public.briefing_links
      where is_active = true and briefing_type = 'site'
    ),
    'completion_rate', (
      select case
        when count(*) = 0 then 0
        else round(100.0 * count(*) filter (where b.status in ('submitted','analyzed')) / count(*), 1)
      end
      from public.briefings b
    )
  ) into v_stats;

  return v_stats;
end;
$$;

grant execute on function public.get_dashboard_stats() to authenticated;

-- =====================================================================
-- 9. Verificacao
-- =====================================================================
select
  'briefing_links' as table_name,
  briefing_type,
  count(*) as total,
  count(*) filter (where is_active) as active
from public.briefing_links
group by briefing_type
union all
select
  'briefings',
  briefing_type,
  count(*),
  count(*) filter (where status = 'draft')
from public.briefings
group by briefing_type
order by table_name, briefing_type;
