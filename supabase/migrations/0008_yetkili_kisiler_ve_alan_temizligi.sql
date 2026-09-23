-- ============================================================================
-- Firma "yetkili kişi" artık tek bir alan değil, birden fazla kişi
-- (ad + ünvan + telefon + e-posta) olabiliyor -> yeni company_contacts
-- tablosu. Kullanılmayan vergi no / sözleşme bedeli / eski tek yetkili
-- kişi alanları kaldırılıyor (var olan veriler önce yeni tabloya taşınır).
-- ============================================================================

create table if not exists public.company_contacts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  full_name text not null,
  title text,
  phone text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_company_contacts_company on public.company_contacts (company_id);

alter table public.company_contacts enable row level security;

drop policy if exists company_contacts_select on public.company_contacts;
create policy company_contacts_select on public.company_contacts
  for select
  using (
    public.is_admin()
    or public.current_role() = 'satin_alma'
    or company_id = public.current_company_id()
    or public.is_muhendis_for(company_id)
  );

drop policy if exists company_contacts_write on public.company_contacts;
create policy company_contacts_write on public.company_contacts
  for all
  using (public.is_admin())
  with check (public.is_admin());

drop trigger if exists trg_company_contacts_updated_at on public.company_contacts;
create trigger trg_company_contacts_updated_at
  before update on public.company_contacts
  for each row execute function public.set_updated_at();

-- Var olan tekil "yetkili kişi" bilgisini yeni tabloya taşı (varsa).
insert into public.company_contacts (company_id, full_name, phone, email)
select id, contact_name, contact_phone, contact_email
from public.companies
where contact_name is not null and btrim(contact_name) <> ''
on conflict do nothing;

-- Artık kullanılmayan alanları kaldır.
alter table public.companies drop column if exists contact_name;
alter table public.companies drop column if exists contact_phone;
alter table public.companies drop column if exists contact_email;
alter table public.companies drop column if exists tax_number;
alter table public.companies drop column if exists contract_amount;
