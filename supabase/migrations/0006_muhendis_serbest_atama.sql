-- ============================================================================
-- Mühendis ataması artık firma bazlı bir "yetki listesi" değil: hakedişi
-- açan firma, sistemdeki mühendislerden istediğini seçer ve o hakedişin
-- ilgilisi olur. Görünürlük/onay yetkisi firma-mühendis eşleştirmesine
-- değil, doğrudan hakedisler.muhendis_id sütununa bağlı.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Firma seçim listesi için: herkes mühendis profillerini görebilsin
-- ----------------------------------------------------------------------------
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select
  using (
    id = auth.uid()
    or public.is_admin()
    or role = 'muhendis'
  );

-- ----------------------------------------------------------------------------
-- companies_select: bir mühendis artık atama listesine bakılmaksızın
-- tüm firmaları görebilir (aynı mühendisler farklı firmaların
-- hakedişlerini kontrol ediyor).
-- ----------------------------------------------------------------------------
create or replace function public.is_muhendis_for(p_company_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select public.is_admin() or public.current_role() = 'muhendis';
$$;

-- ----------------------------------------------------------------------------
-- Belirli bir hakedişin ilgili mühendisi mi? (satır bazlı yetki)
-- ----------------------------------------------------------------------------
create or replace function public.is_muhendis_of_hakedis(p_hakedis_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select public.is_admin() or exists (
    select 1 from public.hakedisler h
    where h.id = p_hakedis_id and h.muhendis_id = auth.uid()
  );
$$;

-- ----------------------------------------------------------------------------
-- HAKEDISLER: görünürlük ve onay yetkisi artık muhendis_id = auth.uid()
-- ----------------------------------------------------------------------------
drop policy if exists hakedisler_select on public.hakedisler;
create policy hakedisler_select on public.hakedisler
  for select
  using (
    public.is_admin()
    or public.current_role() = 'satin_alma'
    or company_id = public.current_company_id()
    or muhendis_id = auth.uid()
  );

drop policy if exists hakedisler_update_muhendis on public.hakedisler;
create policy hakedisler_update_muhendis on public.hakedisler
  for update
  using (
    public.current_role() = 'muhendis'
    and muhendis_id = auth.uid()
    and status = 'incelemede'
  )
  with check (
    muhendis_id = auth.uid()
    and status in ('onaylandi', 'revizyon_istendi', 'silindi')
  );

-- ----------------------------------------------------------------------------
-- Alt tablolar: is_muhendis_for(company_id) yerine is_muhendis_of_hakedis(id)
-- ----------------------------------------------------------------------------
drop policy if exists hakedis_kalemleri_select on public.hakedis_kalemleri;
create policy hakedis_kalemleri_select on public.hakedis_kalemleri
  for select
  using (
    exists (
      select 1 from public.hakedisler h
      where h.id = hakedis_kalemleri.hakedis_id
        and (
          public.is_admin()
          or public.current_role() = 'satin_alma'
          or h.company_id = public.current_company_id()
          or h.muhendis_id = auth.uid()
        )
    )
  );

drop policy if exists hakedis_ekler_select on public.hakedis_ekler;
create policy hakedis_ekler_select on public.hakedis_ekler
  for select
  using (
    exists (
      select 1 from public.hakedisler h
      where h.id = hakedis_ekler.hakedis_id
        and (
          public.is_admin()
          or public.current_role() = 'satin_alma'
          or h.company_id = public.current_company_id()
          or h.muhendis_id = auth.uid()
        )
    )
  );

drop policy if exists hakedis_ekler_insert on public.hakedis_ekler;
create policy hakedis_ekler_insert on public.hakedis_ekler
  for insert
  with check (
    exists (
      select 1 from public.hakedisler h
      where h.id = hakedis_ekler.hakedis_id
        and (
          public.is_admin()
          or (h.company_id = public.current_company_id() and public.current_role() = 'firma')
          or h.muhendis_id = auth.uid()
        )
    )
  );

drop policy if exists hakedis_hareketleri_select on public.hakedis_hareketleri;
create policy hakedis_hareketleri_select on public.hakedis_hareketleri
  for select
  using (
    exists (
      select 1 from public.hakedisler h
      where h.id = hakedis_hareketleri.hakedis_id
        and (
          public.is_admin()
          or public.current_role() = 'satin_alma'
          or h.company_id = public.current_company_id()
          or h.muhendis_id = auth.uid()
        )
    )
  );

drop policy if exists hakedis_hareketleri_insert on public.hakedis_hareketleri;
create policy hakedis_hareketleri_insert on public.hakedis_hareketleri
  for insert
  with check (
    islem_tipi = 'yorum'
    and yapan_id = auth.uid()
    and exists (
      select 1 from public.hakedisler h
      where h.id = hakedis_hareketleri.hakedis_id
        and (
          public.is_admin()
          or public.current_role() = 'satin_alma'
          or h.company_id = public.current_company_id()
          or h.muhendis_id = auth.uid()
        )
    )
  );

drop policy if exists hakedis_ekler_storage_select on storage.objects;
create policy hakedis_ekler_storage_select on storage.objects
  for select
  using (
    bucket_id = 'hakedis-ekler'
    and (
      public.is_admin()
      or public.current_role() = 'satin_alma'
      or exists (
        select 1 from public.hakedisler h
        where h.id::text = (storage.foldername(name))[1]
          and (h.company_id = public.current_company_id() or h.muhendis_id = auth.uid())
      )
    )
  );
