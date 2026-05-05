-- =====================================================================
-- Briefing DocAds — Seed (admin owner)
-- =====================================================================
-- IMPORTANTE: criar primeiro o usuário no Supabase Dashboard:
--   Authentication > Users > Add user > Create new user
--     email: adm@docads.com.br
--     password: DocAds123..
--     ✅ Auto Confirm User
--
-- Depois execute este script. Ele liga o auth.user ao public.admins
-- com role 'owner' (pode criar outros admins).
-- =====================================================================

insert into public.admins (id, full_name, role, is_active)
select id, 'DocAds Admin', 'owner', true
from auth.users
where email = 'adm@docads.com.br'
on conflict (id) do update
  set role = 'owner', is_active = true, full_name = excluded.full_name;

-- Verificação
do $$
declare
  v_count integer;
begin
  select count(*) into v_count from public.admins
  where role = 'owner' and is_active = true;

  if v_count = 0 then
    raise exception 'Nenhum owner ativo encontrado. Crie o usuário adm@docads.com.br no Supabase Auth antes de rodar o seed.';
  end if;

  raise notice 'OK: % owner(s) ativo(s)', v_count;
end $$;
