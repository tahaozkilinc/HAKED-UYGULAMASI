-- ============================================================================
-- ROW LEVEL SECURITY POLİTİKALARI
-- ============================================================================

alter table public.profiles enable row level security;
alter table public.tags enable row level security;
alter table public.companies enable row level security;
alter table public.company_tags enable row level security;
alter table public.muhendis_company_assignments enable row level security;
alter table public.hakedisler enable row level security;
alter table public.hakedis_kalemleri enable row level security;
alter table public.hakedis_ekler enable row level security;
alter table public.hakedis_hareketleri enable row level security;

-- ----------------------------------------------------------------------------
-- PROFILES
-- ----------------------------------------------------------------------------
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select
  using (id = auth.uid() or public.is_admin());

drop policy if exists profiles_insert on public.profiles;
create policy profiles_insert on public.profiles
  for insert
  with check (public.is_admin());

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
  for update
  using (public.is_admin() or id = auth.uid())
  with check (public.is_admin() or (id = auth.uid()));

drop policy if exists profiles_delete on public.profiles;
create policy profiles_delete on public.profiles
  for delete
  using (public.is_admin());

-- ----------------------------------------------------------------------------
-- TAGS (herkes görür, sadece admin yönetir)
-- ----------------------------------------------------------------------------
drop policy if exists tags_select on public.tags;
create policy tags_select on public.tags
  for select
  using (auth.uid() is not null);

drop policy if exists tags_write on public.tags;
create policy tags_write on public.tags
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- ----------------------------------------------------------------------------
-- COMPANIES
-- ----------------------------------------------------------------------------
drop policy if exists companies_select on public.companies;
create policy companies_select on public.companies
  for select
  using (
    public.is_admin()
    or public.current_role() = 'satin_alma'
    or id = public.current_company_id()
    or public.is_muhendis_for(id)
  );

drop policy if exists companies_write on public.companies;
create policy companies_write on public.companies
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- ----------------------------------------------------------------------------
-- COMPANY_TAGS
-- ----------------------------------------------------------------------------
drop policy if exists company_tags_select on public.company_tags;
create policy company_tags_select on public.company_tags
  for select
  using (auth.uid() is not null);

drop policy if exists company_tags_write on public.company_tags;
create policy company_tags_write on public.company_tags
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- ----------------------------------------------------------------------------
-- MUHENDIS_COMPANY_ASSIGNMENTS
-- ----------------------------------------------------------------------------
drop policy if exists muhendis_assign_select on public.muhendis_company_assignments;
create policy muhendis_assign_select on public.muhendis_company_assignments
  for select
  using (public.is_admin() or muhendis_id = auth.uid());

drop policy if exists muhendis_assign_write on public.muhendis_company_assignments;
create policy muhendis_assign_write on public.muhendis_company_assignments
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- ----------------------------------------------------------------------------
-- HAKEDISLER
-- ----------------------------------------------------------------------------
drop policy if exists hakedisler_select on public.hakedisler;
create policy hakedisler_select on public.hakedisler
  for select
  using (
    public.is_admin()
    or public.current_role() = 'satin_alma'
    or company_id = public.current_company_id()
    or public.is_muhendis_for(company_id)
  );

drop policy if exists hakedisler_insert on public.hakedisler;
create policy hakedisler_insert on public.hakedisler
  for insert
  with check (
    public.is_admin()
    or (public.current_role() = 'firma' and company_id = public.current_company_id())
  );

-- Firma: sadece kendi firmasına ait ve taslak/revizyon_istendi durumundaki
-- hakedişleri düzenleyebilir (ve yalnızca incelemeye gönderebilir).
drop policy if exists hakedisler_update_firma on public.hakedisler;
create policy hakedisler_update_firma on public.hakedisler
  for update
  using (
    public.current_role() = 'firma'
    and company_id = public.current_company_id()
    and status in ('taslak', 'revizyon_istendi')
  )
  with check (
    company_id = public.current_company_id()
    and status in ('taslak', 'incelemede')
  );

-- Mühendis: yetkili olduğu firmaların, inceleme aşamasındaki hakedişlerinde
-- karar verebilir (onayla / revizyon iste / sil).
drop policy if exists hakedisler_update_muhendis on public.hakedisler;
create policy hakedisler_update_muhendis on public.hakedisler
  for update
  using (
    public.current_role() = 'muhendis'
    and public.is_muhendis_for(company_id)
    and status = 'incelemede'
  )
  with check (
    public.is_muhendis_for(company_id)
    and status in ('onaylandi', 'revizyon_istendi', 'silindi')
  );

drop policy if exists hakedisler_update_admin on public.hakedisler;
create policy hakedisler_update_admin on public.hakedisler
  for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists hakedisler_delete on public.hakedisler;
create policy hakedisler_delete on public.hakedisler
  for delete
  using (public.is_admin());

-- ----------------------------------------------------------------------------
-- HAKEDIS_KALEMLERI (görünürlük üst hakedişten miras alınır)
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
          or public.is_muhendis_for(h.company_id)
        )
    )
  );

drop policy if exists hakedis_kalemleri_write on public.hakedis_kalemleri;
create policy hakedis_kalemleri_write on public.hakedis_kalemleri
  for all
  using (
    public.is_admin()
    or exists (
      select 1 from public.hakedisler h
      where h.id = hakedis_kalemleri.hakedis_id
        and h.company_id = public.current_company_id()
        and public.current_role() = 'firma'
        and h.status in ('taslak', 'revizyon_istendi')
    )
  )
  with check (
    public.is_admin()
    or exists (
      select 1 from public.hakedisler h
      where h.id = hakedis_kalemleri.hakedis_id
        and h.company_id = public.current_company_id()
        and public.current_role() = 'firma'
        and h.status in ('taslak', 'revizyon_istendi')
    )
  );

-- ----------------------------------------------------------------------------
-- HAKEDIS_EKLER
-- ----------------------------------------------------------------------------
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
          or public.is_muhendis_for(h.company_id)
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
          or public.is_muhendis_for(h.company_id)
        )
    )
  );

drop policy if exists hakedis_ekler_delete on public.hakedis_ekler;
create policy hakedis_ekler_delete on public.hakedis_ekler
  for delete
  using (public.is_admin() or yukleyen_id = auth.uid());

-- ----------------------------------------------------------------------------
-- HAKEDIS_HAREKETLERI
-- ----------------------------------------------------------------------------
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
          or public.is_muhendis_for(h.company_id)
        )
    )
  );

-- Sadece manuel yorum eklemeye izin ver; durum geçişleri trigger (security definer) ile yazılır.
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
          or public.is_muhendis_for(h.company_id)
        )
    )
  );

-- ----------------------------------------------------------------------------
-- STORAGE: hakedis-ekler bucket'ı için erişim
-- ----------------------------------------------------------------------------
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
          and (h.company_id = public.current_company_id() or public.is_muhendis_for(h.company_id))
      )
    )
  );

drop policy if exists hakedis_ekler_storage_insert on storage.objects;
create policy hakedis_ekler_storage_insert on storage.objects
  for insert
  with check (
    bucket_id = 'hakedis-ekler'
    and auth.uid() is not null
  );

drop policy if exists hakedis_ekler_storage_delete on storage.objects;
create policy hakedis_ekler_storage_delete on storage.objects
  for delete
  using (
    bucket_id = 'hakedis-ekler'
    and (public.is_admin() or owner = auth.uid())
  );
