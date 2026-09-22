-- ============================================================================
-- BAŞLANGIÇ VERİSİ: örnek iş kolu etiketleri
-- Bunlar sadece başlangıç için öneridir; admin panelinden serbestçe
-- eklenip/silinebilir/düzenlenebilir.
-- ============================================================================

insert into public.tags (name, color) values
  ('Vinç', '#f97316'),
  ('İzolasyon', '#0ea5e9'),
  ('Elektrik', '#eab308'),
  ('Mekanik Tesisat', '#6366f1'),
  ('İnşaat', '#78716c'),
  ('Sıhhi Tesisat', '#06b6d4'),
  ('Çelik Konstrüksiyon', '#334155'),
  ('Boya', '#ec4899'),
  ('Cephe', '#22c55e'),
  ('Yangın Tesisatı', '#ef4444'),
  ('Peyzaj / Altyapı', '#84cc16')
on conflict (name) do nothing;

-- ----------------------------------------------------------------------------
-- İlk yönetici (admin) kullanıcısı
-- ----------------------------------------------------------------------------
-- 1) Önce Supabase Authentication panelinden (veya uygulamadaki kayıt formundan)
--    normal bir kullanıcı olarak hesabınızı oluşturun.
-- 2) Ardından aşağıdaki sorguyu kendi e-postanızla çalıştırarak admin yapın:
--
--   update public.profiles set role = 'admin' where email = 'ornek@sirket.com';
--
-- Bu adım güvenlik nedeniyle otomatik yapılmaz; admin rolü elle atanmalıdır.
