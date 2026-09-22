-- ============================================================================
-- HAKEDIŞ TAKİP SİSTEMİ - Temel şema
-- ============================================================================
-- Roller: admin (yönetici/sistem sahibi), firma (taşeron), muhendis (işi veren
-- mühendis / onay mercii), satin_alma (satın alma - salt okunur gözlem).
--
-- Akış: Firma hakedişi girer -> 'incelemede' -> Mühendis onaylar ('onaylandi',
-- süreç kapanır ama kayıt sistemde kalır) ya da revizyon ister
-- ('revizyon_istendi' -> firma düzenler -> tekrar 'incelemede', sistemde
-- "revize edildi" uyarısı görünür) ya da hakedişi siler ('silindi').
-- Satın alma tüm süreci uçtan uca görebilir ama düzenleyemez.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- ENUM TİPLERİ
-- ----------------------------------------------------------------------------
do $$ begin
  create type public.user_role as enum ('admin', 'firma', 'muhendis', 'satin_alma');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.hakedis_status as enum (
    'taslak',            -- firma henüz göndermedi, üzerinde çalışıyor
    'incelemede',        -- mühendis onayı bekliyor
    'revizyon_istendi',  -- mühendis revizyon istedi, firma düzenlemeli
    'onaylandi',         -- mühendis onayladı, süreç kapandı (kayıt kalıcı)
    'silindi'             -- mühendis/admin tarafından iptal edildi (soft delete)
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.hareket_tipi as enum (
    'olusturuldu',
    'guncellendi',
    'gonderildi',
    'revizyon_istendi',
    'revize_edildi',
    'onaylandi',
    'silindi',
    'yorum',
    'ek_eklendi'
  );
exception when duplicate_object then null; end $$;

-- ----------------------------------------------------------------------------
-- PROFİLLER (auth.users ile bire bir eşleşir)
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  email text not null default '',
  role public.user_role not null default 'firma',
  company_id uuid, -- firma rolündeki kullanıcının bağlı olduğu firma (FK aşağıda eklenir)
  phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Sistem kullanıcıları: admin, firma, mühendis, satın alma.';
comment on column public.profiles.company_id is 'Sadece role=firma için doludur; kullanıcının bağlı olduğu firmayı belirtir.';

-- ----------------------------------------------------------------------------
-- ETİKETLER (iş kolu: vinç, izolasyon, elektrik, vb.)
-- ----------------------------------------------------------------------------
create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  color text not null default '#64748b',
  created_at timestamptz not null default now()
);

comment on table public.tags is 'Firma etiketleri / iş kolları (Vinç, İzolasyon, Elektrik...). Admin tarafından serbestçe yönetilir.';

-- ----------------------------------------------------------------------------
-- FİRMALAR
-- ----------------------------------------------------------------------------
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  short_code text unique,
  tax_number text,
  contact_name text,
  contact_phone text,
  contact_email text,
  contract_amount numeric(18, 2),
  currency text not null default 'TRY',
  is_active boolean not null default true,
  hakedis_schema jsonb not null default '{"fields": []}'::jsonb,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.companies is 'Anlaşmalı firmalar (taşeronlar). Her firmanın kendine özel hakediş kalem şeması (hakedis_schema) vardır.';
comment on column public.companies.hakedis_schema is 'Dinamik form şeması: {"fields":[{"key","label","type","required","options","formula","unit"}, ...]}';

alter table public.profiles
  add constraint profiles_company_id_fkey
  foreign key (company_id) references public.companies (id) on delete set null;

-- ----------------------------------------------------------------------------
-- FİRMA <-> ETİKET (çoktan-çoğa)
-- ----------------------------------------------------------------------------
create table if not exists public.company_tags (
  company_id uuid not null references public.companies (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  primary key (company_id, tag_id)
);

-- ----------------------------------------------------------------------------
-- MÜHENDİS <-> FİRMA ATAMALARI
-- ----------------------------------------------------------------------------
create table if not exists public.muhendis_company_assignments (
  id uuid primary key default gen_random_uuid(),
  muhendis_id uuid not null references public.profiles (id) on delete cascade,
  company_id uuid not null references public.companies (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (muhendis_id, company_id)
);

comment on table public.muhendis_company_assignments is 'Hangi mühendisin hangi firmaların hakedişlerini onaylamaya yetkili olduğunu belirler.';

-- ----------------------------------------------------------------------------
-- HAKEDİŞLER (başlık)
-- ----------------------------------------------------------------------------
create table if not exists public.hakedisler (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete restrict,
  hakedis_no integer not null,
  donem_baslangic date not null,
  donem_bitis date not null,
  status public.hakedis_status not null default 'taslak',
  ara_toplam numeric(18, 2) not null default 0,
  kesintiler jsonb not null default '[]'::jsonb,
  kesinti_toplam numeric(18, 2) not null default 0,
  kdv_orani numeric(5, 2) not null default 20,
  kdv_tutari numeric(18, 2) not null default 0,
  net_tutar numeric(18, 2) not null default 0,
  kumulatif_tutar numeric(18, 2) not null default 0,
  aciklama text,
  revizyon_sayisi integer not null default 0,
  son_revizyon_notu text,
  created_by uuid not null references public.profiles (id),
  muhendis_id uuid references public.profiles (id),
  karar_veren_id uuid references public.profiles (id),
  karar_tarihi timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, hakedis_no)
);

comment on table public.hakedisler is 'Hakediş başlıkları. status=onaylandi olunca süreç kapanır; kayıt silinmez, salt okunur hale gelir.';
comment on column public.hakedisler.kesintiler is '[{"ad":"Teminat Kesintisi","tutar":1234.56}, ...] biçiminde manuel kesinti kalemleri.';

create table if not exists public.hakedis_kalemleri (
  id uuid primary key default gen_random_uuid(),
  hakedis_id uuid not null references public.hakedisler (id) on delete cascade,
  sira_no integer not null default 1,
  data jsonb not null default '{}'::jsonb,
  tutar numeric(18, 2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.hakedis_kalemleri is 'Hakediş satırları. data alanı, firmanın hakedis_schema tanımına göre serbest biçimlidir; tutar alanı toplulaştırma için ayrıca tutulur.';

create table if not exists public.hakedis_ekler (
  id uuid primary key default gen_random_uuid(),
  hakedis_id uuid not null references public.hakedisler (id) on delete cascade,
  dosya_adi text not null,
  storage_path text not null,
  boyut bigint,
  yukleyen_id uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create table if not exists public.hakedis_hareketleri (
  id uuid primary key default gen_random_uuid(),
  hakedis_id uuid not null references public.hakedisler (id) on delete cascade,
  islem_tipi public.hareket_tipi not null,
  aciklama text,
  yapan_id uuid references public.profiles (id),
  onceki_durum public.hakedis_status,
  yeni_durum public.hakedis_status,
  created_at timestamptz not null default now()
);

comment on table public.hakedis_hareketleri is 'Hakediş üzerindeki tüm hareketlerin (durum değişikliği, revizyon, yorum) denetim kaydı.';

-- ----------------------------------------------------------------------------
-- İNDEKSLER
-- ----------------------------------------------------------------------------
create index if not exists idx_profiles_company on public.profiles (company_id);
create index if not exists idx_profiles_role on public.profiles (role);
create index if not exists idx_company_tags_tag on public.company_tags (tag_id);
create index if not exists idx_muhendis_assignments_muhendis on public.muhendis_company_assignments (muhendis_id);
create index if not exists idx_muhendis_assignments_company on public.muhendis_company_assignments (company_id);
create index if not exists idx_hakedisler_company on public.hakedisler (company_id);
create index if not exists idx_hakedisler_status on public.hakedisler (status);
create index if not exists idx_hakedisler_muhendis on public.hakedisler (muhendis_id);
create index if not exists idx_hakedis_kalemleri_hakedis on public.hakedis_kalemleri (hakedis_id);
create index if not exists idx_hakedis_ekler_hakedis on public.hakedis_ekler (hakedis_id);
create index if not exists idx_hakedis_hareketleri_hakedis on public.hakedis_hareketleri (hakedis_id);

-- ----------------------------------------------------------------------------
-- STORAGE BUCKET (hakediş ekleri)
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('hakedis-ekler', 'hakedis-ekler', false)
on conflict (id) do nothing;
