import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Service role anahtarı yalnızca sunucu tarafında, admin işlemleri (kullanıcı
// davet etme, rol atama vb.) için kullanılır. İstemciye ASLA gönderilmez.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY tanımlı değil. Kullanıcı davet etme işlemleri için .env.local dosyasına ekleyin.",
    );
  }

  return createSupabaseClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
