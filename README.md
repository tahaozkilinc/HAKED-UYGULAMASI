# Hakediş Takip Sistemi

Anlaşmalı firmaların (taşeronların) hakedişlerini tek bir portaldan; firma,
mühendis (işi veren) ve satın alma tarafının birlikte yönetebildiği bir
sistem. Next.js (App Router) + Supabase (Postgres, Auth, Storage, RLS) ile
kurulmuştur.

## Mimari Özet

- **Next.js 16** (App Router, Server Actions, Server Components) — `src/app`
- **Supabase** — Postgres veritabanı, kimlik doğrulama, dosya depolama ve
  Row Level Security (RLS) ile yetkilendirme. SQL şeması `supabase/migrations`
  altında elle yazılmış migration dosyaları olarak tutulur.
- **shadcn/ui tarzı bileşenler** (`src/components/ui`) — Radix UI primitifleri
  üzerine Tailwind v4 ile elle kurulmuştur (bu ortamda `ui.shadcn.com`
  registry'sine ağ erişimi olmadığı için CLI yerine bileşenler doğrudan
  yazıldı; davranış ve API'leri shadcn/ui ile birebir aynıdır).
- **Dinamik form motoru** (`src/components/hakedis/schema-builder.tsx`,
  `kalem-form.tsx`) — her firmanın kendine özgü hakediş kalem yapısını
  (alan adları, tipleri, formülleri) admin panelinden tanımlamasını sağlar.

## Roller ve Yetkiler

| Rol | Türkçe | Yetkiler |
|---|---|---|
| `admin` | Yönetici | Firmaları, etiketleri, kullanıcıları ve hakediş form şablonlarını yönetir. Tüm kayıtları görür. |
| `firma` | Firma | Sadece kendi firmasının hakedişlerini girer/düzenler (taslak veya revizyon istendiğinde). |
| `muhendis` | Mühendis (işi veren) | Kendisine atanan firmaların, "incelemede" durumundaki hakedişlerini onaylar, revizyon ister veya siler. |
| `satin_alma` | Satın Alma | Tüm süreci baştan sona görür; **düzenleme yetkisi yoktur** (salt okunur). |

Yetkilendirme hem **Postgres RLS politikalarında** (`0003_rls_policies.sql`)
hem de sunucu tarafı sayfa/aksiyonlarda (`requireRole`, `requireProfile`)
çift katmanlı olarak uygulanır — istemci tarafı sadece arayüzü gizler, asıl
güvenlik veritabanı seviyesindedir.

## Hakediş Süreci

```
Firma girer ──► İncelemede (Mühendis onayı bekliyor)
                    │
        ┌───────────┼─────────────────┐
        ▼           ▼                 ▼
    Onaylandı   Revizyon İstendi     Silindi
   (süreç kapanır, (firma düzenler,   (soft delete,
    kayıt kalıcı    tekrar "İncelemede"  kayıt geçmişte
    ve salt okunur) durumuna döner —     kalır)
                    sistemde "Revize
                    Edildi" uyarısı
                    gösterilir)
```

- Mühendis onayı **tek onay kapısıdır**: onayladıktan sonra başka bir onaya
  gerek yoktur, hakediş `onaylandi` durumuna geçer ve salt okunur hale gelir
  (kayıt silinmez, sistemde kalır).
- Mühendis revizyon isterse hakediş `revizyon_istendi` durumuna düşer, firma
  düzenleyip tekrar gönderir (`incelemede`'ye döner). Bu geçiş otomatik
  olarak "revize edildi" hareketi olarak loglanır ve arayüzde turuncu bir
  uyarı rozeti (`revizyon_sayisi > 0`) olarak gösterilir — firmanın tekrar
  ayrıca bir yere onay için gitmesi gerekmez.
- Satın alma, sürecin tamamını (taslaktan onaya kadar) görebilir ama hiçbir
  aşamada düzenleme yapamaz.
- Mali hesaplamalar (ara toplam, kesintiler, KDV, net tutar, kümülatif
  tutar) veritabanı tetikleyicileri (`0002_functions_triggers.sql`)
  tarafından otomatik hesaplanır; uygulama katmanı sadece kalemleri ve
  kesinti listesini yazar.

## Veri Modeli (özet)

- `companies` — firmalar. `hakedis_schema` (JSONB) alanı, o firmanın hakediş
  kalemlerinde hangi alanların (kalem no, açıklama, birim, miktar, birim
  fiyat, hesaplanan tutar vb.) olacağını tanımlayan **dinamik form
  şeması**dır. Her firma için farklı olabilir.
- `tags` / `company_tags` — iş kolu etiketleri (Vinç, İzolasyon, Elektrik…),
  bir firmaya birden fazla etiket atanabilir.
- `profiles` — sistem kullanıcıları (`auth.users` ile bire bir).
- `muhendis_company_assignments` — hangi mühendisin hangi firmaları
  onaylamaya yetkili olduğunu belirler.
- `hakedisler` — hakediş başlıkları (dönem, durum, tutarlar, kim onayladı…).
- `hakedis_kalemleri` — hakediş satırları; `data` alanı firmanın
  `hakedis_schema`'sına göre serbest biçimlidir.
- `hakedis_ekler` — dosya ekleri (Supabase Storage, `hakedis-ekler` bucket'ı).
- `hakedis_hareketleri` — tüm durum değişikliklerinin ve yorumların denetim
  kaydı (audit log).

## Kurulum

### 1. Supabase projesini bağlayın

```bash
cp .env.local.example .env.local
```

`.env.local` içine Supabase projenizin (Project Settings → API) şu
değerlerini girin:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (sadece admin kullanıcı davet etme işlemleri
  için sunucu tarafında kullanılır, istemciye asla gönderilmez)
- `RESEND_API_KEY` (opsiyonel — hakediş bir mühendise gönderildiğinde
  bildirim e-postası atmak için, https://resend.com)

### 2. Veritabanı şemasını uygulayın

`supabase/migrations` altındaki dosyaları sırasıyla (0001 → 0005) Supabase
SQL Editor'de çalıştırın, ya da Supabase CLI kullanıyorsanız:

```bash
supabase link --project-ref <proje-ref>
supabase db push
```

### 3. İlk yönetici hesabını oluşturun

1. Uygulamadan (veya Supabase Authentication panelinden) normal bir kullanıcı
   olarak kaydolun / hesap oluşturun.
2. SQL Editor'de kendinizi admin yapın:

   ```sql
   update public.profiles set role = 'admin' where email = 'sizin@eposta.com';
   ```

Bundan sonra tüm kullanıcı yönetimi (firma, mühendis, satın alma hesapları)
**Kullanıcılar** sayfasından yapılabilir; admin bir kullanıcı davet ettiğinde
sistem geçici bir şifre üretir ve bunu güvenli bir kanaldan ilgili kişiyle
paylaşmanız gerekir.

### 4. 11 firmayı ve etiketleri tanımlayın

**Firmalar** sayfasından firmaları ekleyin, her birine uygun **etiketleri**
(iş kolu) atayın ve **Hakediş Formu** sekmesinden o firmaya özel kalem
şablonunu (alanlar, tipler, formüller) tanımlayın. Ardından **Mühendisler**
sekmesinden o firmanın hakedişlerini onaylayacak mühendisi/mühendisleri
atayın.

### 5. Geliştirme sunucusu

```bash
npm install
npm run dev
```

## Notlar / Sonraki Adımlar

- Bu depo, gerçek bir Supabase projesine henüz bağlı değildir; `.env.local`
  girildikten ve migration'lar uygulandıktan sonra tüm akış (giriş, hakediş
  girişi, onay, dosya yükleme) çalışır hale gelir.
- `src/types/database.ts` elle yazılmıştır; Supabase bağlandıktan sonra
  `supabase gen types typescript --project-id <id> > src/types/database.ts`
  ile otomatik üretilen tiplerle güncellenmesi önerilir (mevcut alan adları
  ile birebir uyumludur).
- E-posta ile davet (magic link / invite email) yerine, MVP'de admin'in
  paylaştığı geçici şifre yöntemi kullanılmaktadır; Supabase projesinde SMTP
  yapılandırıldıktan sonra `inviteUserByEmail` akışına geçilebilir.
