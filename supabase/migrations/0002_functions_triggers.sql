-- ============================================================================
-- FONKSİYONLAR VE TETİKLEYİCİLER
-- ============================================================================

-- ----------------------------------------------------------------------------
-- updated_at otomatik güncelleme
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists trg_companies_updated_at on public.companies;
create trigger trg_companies_updated_at
  before update on public.companies
  for each row execute function public.set_updated_at();

drop trigger if exists trg_hakedisler_updated_at on public.hakedisler;
create trigger trg_hakedisler_updated_at
  before update on public.hakedisler
  for each row execute function public.set_updated_at();

drop trigger if exists trg_hakedis_kalemleri_updated_at on public.hakedis_kalemleri;
create trigger trg_hakedis_kalemleri_updated_at
  before update on public.hakedis_kalemleri
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- Yetki yardımcı fonksiyonları (RLS politikalarında kullanılır)
-- SECURITY DEFINER: profiles tablosuna RLS'siz erişip sonsuz döngüyü önler.
-- ----------------------------------------------------------------------------
create or replace function public.current_role()
returns public.user_role
language sql
security definer
stable
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.current_company_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select company_id from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce((select role = 'admin' from public.profiles where id = auth.uid()), false);
$$;

create or replace function public.is_muhendis_for(p_company_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select public.is_admin() or exists (
    select 1 from public.muhendis_company_assignments
    where muhendis_id = auth.uid() and company_id = p_company_id
  );
$$;

-- ----------------------------------------------------------------------------
-- Yeni auth kullanıcısı oluşunca otomatik profil satırı aç
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role, company_id)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce((new.raw_user_meta_data ->> 'role')::public.user_role, 'firma'),
    nullif(new.raw_user_meta_data ->> 'company_id', '')::uuid
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- Firma başına otomatik ardışık hakediş numarası
-- ----------------------------------------------------------------------------
create or replace function public.assign_hakedis_no()
returns trigger
language plpgsql
as $$
begin
  if new.hakedis_no is null or new.hakedis_no = 0 then
    select coalesce(max(hakedis_no), 0) + 1
      into new.hakedis_no
      from public.hakedisler
      where company_id = new.company_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_assign_hakedis_no on public.hakedisler;
create trigger trg_assign_hakedis_no
  before insert on public.hakedisler
  for each row execute function public.assign_hakedis_no();

-- ----------------------------------------------------------------------------
-- Kalem toplamlarından hakediş başlık tutarlarını yeniden hesapla
-- ----------------------------------------------------------------------------
create or replace function public.recompute_hakedis_totals(p_hakedis_id uuid)
returns void
language plpgsql
as $$
declare
  v_ara_toplam numeric(18, 2);
  v_kesinti_toplam numeric(18, 2);
  v_kdv_orani numeric(5, 2);
  v_kdv_tutari numeric(18, 2);
  v_net_tutar numeric(18, 2);
begin
  select coalesce(sum(tutar), 0) into v_ara_toplam
    from public.hakedis_kalemleri where hakedis_id = p_hakedis_id;

  select kdv_orani into v_kdv_orani from public.hakedisler where id = p_hakedis_id;

  select coalesce(sum((item ->> 'tutar')::numeric), 0) into v_kesinti_toplam
    from public.hakedisler, jsonb_array_elements(kesintiler) as item
    where id = p_hakedis_id;

  v_kdv_tutari := round((v_ara_toplam - v_kesinti_toplam) * (coalesce(v_kdv_orani, 0) / 100.0), 2);
  v_net_tutar := (v_ara_toplam - v_kesinti_toplam) + v_kdv_tutari;

  update public.hakedisler
    set ara_toplam = v_ara_toplam,
        kesinti_toplam = v_kesinti_toplam,
        kdv_tutari = v_kdv_tutari,
        net_tutar = v_net_tutar
    where id = p_hakedis_id;
end;
$$;

create or replace function public.trg_recompute_on_kalem_change()
returns trigger
language plpgsql
as $$
begin
  perform public.recompute_hakedis_totals(coalesce(new.hakedis_id, old.hakedis_id));
  return null;
end;
$$;

drop trigger if exists trg_hakedis_kalemleri_totals on public.hakedis_kalemleri;
create trigger trg_hakedis_kalemleri_totals
  after insert or update or delete on public.hakedis_kalemleri
  for each row execute function public.trg_recompute_on_kalem_change();

-- kesintiler/kdv_orani başlıkta değişirse de yeniden hesapla
create or replace function public.trg_recompute_on_header_change()
returns trigger
language plpgsql
as $$
begin
  if new.kesintiler is distinct from old.kesintiler or new.kdv_orani is distinct from old.kdv_orani then
    perform public.recompute_hakedis_totals(new.id);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_hakedisler_header_totals on public.hakedisler;
create trigger trg_hakedisler_header_totals
  after update on public.hakedisler
  for each row execute function public.trg_recompute_on_header_change();

-- ----------------------------------------------------------------------------
-- Durum geçişlerini denetim kaydına yaz + onay anında kümülatif tutarı hesapla
-- ----------------------------------------------------------------------------
create or replace function public.trg_hakedis_status_audit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_islem public.hareket_tipi;
  v_onceki_kumulatif numeric(18, 2);
begin
  if tg_op = 'INSERT' then
    insert into public.hakedis_hareketleri (hakedis_id, islem_tipi, yapan_id, yeni_durum)
    values (new.id, 'olusturuldu', new.created_by, new.status);
    return new;
  end if;

  if new.status is distinct from old.status then
    v_islem := case new.status
      when 'incelemede' then (case when old.status = 'revizyon_istendi' then 'revize_edildi' else 'gonderildi' end)
      when 'revizyon_istendi' then 'revizyon_istendi'
      when 'onaylandi' then 'onaylandi'
      when 'silindi' then 'silindi'
      else 'guncellendi'
    end;

    if new.status = 'revizyon_istendi' then
      new.revizyon_sayisi := old.revizyon_sayisi + 1;
    end if;

    if new.status = 'onaylandi' then
      select coalesce(max(kumulatif_tutar), 0) into v_onceki_kumulatif
        from public.hakedisler
        where company_id = new.company_id and status = 'onaylandi' and id <> new.id;
      new.kumulatif_tutar := v_onceki_kumulatif + new.net_tutar;
      new.karar_tarihi := now();
    end if;

    insert into public.hakedis_hareketleri (hakedis_id, islem_tipi, aciklama, yapan_id, onceki_durum, yeni_durum)
    values (new.id, v_islem, new.son_revizyon_notu, coalesce(new.karar_veren_id, new.created_by), old.status, new.status);
  end if;

  return new;
end;
$$;

drop trigger if exists trg_hakedisler_insert_audit on public.hakedisler;
create trigger trg_hakedisler_insert_audit
  after insert on public.hakedisler
  for each row execute function public.trg_hakedis_status_audit();

drop trigger if exists trg_hakedisler_status_audit on public.hakedisler;
create trigger trg_hakedisler_status_audit
  before update on public.hakedisler
  for each row execute function public.trg_hakedis_status_audit();
