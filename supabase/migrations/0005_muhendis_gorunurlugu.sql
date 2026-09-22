-- ============================================================================
-- Firma kullanıcılarının, hakediş oluştururken kendi firmalarına atanmış
-- mühendisleri görüp seçebilmesi için gereken RLS güncellemesi.
-- ============================================================================

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select
  using (
    id = auth.uid()
    or public.is_admin()
    or (
      role = 'muhendis'
      and exists (
        select 1 from public.muhendis_company_assignments mca
        where mca.muhendis_id = profiles.id
          and mca.company_id = public.current_company_id()
      )
    )
  );

drop policy if exists muhendis_assign_select on public.muhendis_company_assignments;
create policy muhendis_assign_select on public.muhendis_company_assignments
  for select
  using (
    public.is_admin()
    or muhendis_id = auth.uid()
    or company_id = public.current_company_id()
  );
