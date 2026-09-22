import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Server Component / Server Action / Route Handler içinde kullanılır.
// Server Component içinden çağrıldığında cookie yazma işlemleri sessizce
// yok sayılır; oturum yenilemesi middleware tarafından yapılır.
//
// `Database` generic'i kasıtlı olarak verilmiyor (bkz. lib/supabase/client.ts
// içindeki not) — insert/update çağrılarında kütüphane sürümüne özgü bir
// tip çıkarım sorununa yol açıyor. Okuma sonuçları src/lib/data/*.ts'te
// elle src/types/database.ts tiplerine cast edilir.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Component içinden çağrıldığında yazma başarısız olur;
            // middleware oturumu zaten tazelediği için görmezden gelinebilir.
          }
        },
      },
    },
  );
}
