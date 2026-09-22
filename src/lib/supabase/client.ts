import { createBrowserClient } from "@supabase/ssr";

// NOT: `Database` tipi burada kasıtlı olarak kullanılmıyor. Bu projede
// kullanılan @supabase/supabase-js sürümünün insert/update generic
// çıkarımı, elle yazılmış bir Database tipiyle (Relationships/Views/
// Functions alanları doğru olsa bile) "never" tipine düşüyor. Supabase
// projesi bağlandıktan sonra `supabase gen types` ile üretilecek tipin bu
// sorunu yaşayıp yaşamadığı kontrol edilip mümkünse tekrar eklenebilir.
// Okuma tarafında tüm veri erişim fonksiyonları zaten `src/types/database.ts`
// tiplerine elle cast yapıyor (bkz. src/lib/data/*.ts).
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
