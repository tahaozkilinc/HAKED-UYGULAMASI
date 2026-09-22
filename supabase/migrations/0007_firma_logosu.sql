-- ============================================================================
-- Firma logosu: companies.logo_url + herkese açık "firma-logolari" bucket.
-- Loglar hassas veri değildir (PDF çıktısında ve arayüzde görünür), bu
-- yüzden okuma herkese açık; yükleme/silme sadece admin.
-- ============================================================================

alter table public.companies add column if not exists logo_url text;

insert into storage.buckets (id, name, public)
values ('firma-logolari', 'firma-logolari', true)
on conflict (id) do nothing;

drop policy if exists firma_logolari_select on storage.objects;
create policy firma_logolari_select on storage.objects
  for select
  using (bucket_id = 'firma-logolari');

drop policy if exists firma_logolari_write on storage.objects;
create policy firma_logolari_write on storage.objects
  for insert
  with check (bucket_id = 'firma-logolari' and public.is_admin());

drop policy if exists firma_logolari_update on storage.objects;
create policy firma_logolari_update on storage.objects
  for update
  using (bucket_id = 'firma-logolari' and public.is_admin());

drop policy if exists firma_logolari_delete on storage.objects;
create policy firma_logolari_delete on storage.objects
  for delete
  using (bucket_id = 'firma-logolari' and public.is_admin());
