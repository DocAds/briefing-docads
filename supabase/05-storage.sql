-- =====================================================================
-- Briefing DocAds — Storage Bucket
-- =====================================================================
-- Cria bucket para upload de arquivos do briefing (brandbook, etc.).
-- Anônimos podem fazer INSERT (upload), leitura é pública.
-- Limite: 10MB por arquivo, MIME types restritos.
-- =====================================================================

-- 1. Bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'briefing-files',
  'briefing-files',
  true,
  10485760, -- 10 MB
  array[
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'application/zip'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- 2. Policy: anônimos podem fazer upload
drop policy if exists "briefing_files_anon_upload" on storage.objects;
create policy "briefing_files_anon_upload"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'briefing-files');

-- 3. Policy: leitura pública (necessário para admin ver e cliente baixar)
drop policy if exists "briefing_files_public_read" on storage.objects;
create policy "briefing_files_public_read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'briefing-files');

-- 4. Verificação
select
  id as bucket,
  public,
  pg_size_pretty(file_size_limit) as max_file_size,
  array_length(allowed_mime_types, 1) as mime_types_allowed
from storage.buckets
where id = 'briefing-files';
