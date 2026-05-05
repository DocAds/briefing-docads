-- =====================================================================
-- Briefing DocAds — RPC Functions (security definer)
-- =====================================================================
-- Funções públicas chamadas pelo cliente anônimo (preenchimento do form).
-- security definer = roda com permissões do owner, ignorando RLS,
-- mas só acessa o que a função permite.
-- =====================================================================

-- =====================================================================
-- get_briefing_by_slug — carrega dados pra cliente preencher
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

  -- pega o briefing mais recente; se for submitted, não retorna pra edição
  select * into v_briefing
  from public.briefings
  where client_id = v_link.client_id
  order by created_at desc
  limit 1;

  -- Atualiza contador de acesso
  update public.briefing_links
  set access_count = access_count + 1,
      last_accessed_at = now()
  where id = v_link.id;

  -- Marca cliente como em andamento na 1ª vez que abre
  if v_client.status = 'pending' then
    update public.clients
    set status = 'in_progress', updated_at = now()
    where id = v_client.id;
  end if;

  return json_build_object(
    'link_id', v_link.id,
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
-- save_briefing_draft — salva rascunho (auto-save)
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

  -- procura draft existente
  select id into v_briefing_id
  from public.briefings
  where client_id = v_link.client_id and status = 'draft'
  order by created_at desc
  limit 1;

  if v_briefing_id is null then
    insert into public.briefings (client_id, link_id, answers, progress, current_step, status)
    values (v_link.client_id, v_link.id, p_answers, p_progress, p_current_step, 'draft')
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
-- submit_briefing — finaliza o briefing
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

  -- finaliza briefing
  select id into v_briefing_id
  from public.briefings
  where client_id = v_link.client_id and status = 'draft'
  order by created_at desc
  limit 1;

  if v_briefing_id is null then
    insert into public.briefings (client_id, link_id, answers, progress, current_step, status, submitted_at)
    values (v_link.client_id, v_link.id, p_answers, 100, 99, 'submitted', now())
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

  -- atualiza cliente
  update public.clients
  set status = 'completed', updated_at = now()
  where id = v_link.client_id;

  -- log
  insert into public.activity_log (client_id, briefing_id, action, meta)
  values (v_link.client_id, v_briefing_id, 'briefing_submitted',
    json_build_object('company_name', v_client.company_name));

  -- desativa o link após submissão (impede re-edição)
  update public.briefing_links
  set is_active = false
  where id = v_link.id;

  return json_build_object(
    'briefing_id', v_briefing_id,
    'client_id', v_link.client_id,
    'company_name', v_client.company_name
  );
end;
$$;

grant execute on function public.submit_briefing(text, jsonb) to anon, authenticated;

-- =====================================================================
-- generate_slug — helper pra gerar slugs únicos no admin
-- =====================================================================
create or replace function public.generate_briefing_slug(p_company_name text)
returns text
language plpgsql
as $$
declare
  v_base text;
  v_random text;
  v_slug text;
  v_attempts integer := 0;
begin
  -- Normaliza nome: lowercase, remove acentos, troca não-alfanumérico por hífen
  v_base := lower(p_company_name);
  v_base := translate(v_base,
    'áàâãäéèêëíìîïóòôõöúùûüçñÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ',
    'aaaaaeeeeiiiiooooouuuucnaaaaaeeeeiiiiooooouuuucn');
  v_base := regexp_replace(v_base, '[^a-z0-9]+', '-', 'g');
  v_base := regexp_replace(v_base, '^-+|-+$', '', 'g');
  v_base := substring(v_base from 1 for 40);

  -- Tenta com 4 chars random
  loop
    v_random := substring(md5(random()::text || clock_timestamp()::text) from 1 for 4);
    v_slug := v_base || '-' || v_random;

    if not exists (select 1 from public.briefing_links where slug = v_slug) then
      return v_slug;
    end if;

    v_attempts := v_attempts + 1;
    if v_attempts > 10 then
      raise exception 'Não foi possível gerar slug único';
    end if;
  end loop;
end;
$$;

-- =====================================================================
-- get_dashboard_stats — métricas pro dashboard admin
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
