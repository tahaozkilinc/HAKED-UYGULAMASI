import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

// React `cache()` ile bir istek (request) içinde birden fazla yerden
// (layout + sayfa) çağrılsa bile Supabase'e sadece bir kez gidilir —
// aksi halde her sayfa geçişinde auth kontrolü tekrar tekrar yapılıp
// gereksiz gecikmeye yol açıyordu.
//
// getSession() (ağ isteği yapmadan, çerezden yerel JWT çözümü) kasıtlı
// olarak getUser() yerine kullanılıyor: middleware (updateSession) bu
// isteğin çerezlerini zaten Supabase Auth sunucusuna karşı doğrulamış
// durumda; burada tekrar ağ isteği yapmak sadece gecikme ekler. Asıl
// güvenlik sınırı zaten Postgres RLS'tir — her veri sorgusu JWT imzasını
// veritabanı tarafında bağımsızca doğrular, dolayısıyla burada yerel
// oturumu "güvenilir" saymak veri erişimini gevşetmez.
export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user;

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return profile as Profile | null;
});

export async function requireProfile(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (!profile.is_active) {
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/login?next=%2F");
  }
  return profile;
}

export async function requireRole(...roles: Profile["role"][]): Promise<Profile> {
  const profile = await requireProfile();
  if (!roles.includes(profile.role)) {
    redirect("/");
  }
  return profile;
}
