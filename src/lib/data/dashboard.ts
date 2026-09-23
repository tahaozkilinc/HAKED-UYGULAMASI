import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { HakedisStatus, Profile } from "@/types/database";

interface DashboardHakedisRow {
  id: string;
  hakedis_no: number;
  donem_baslangic: string;
  donem_bitis: string;
  status: HakedisStatus;
  revizyon_sayisi: number;
  companies: { name: string } | null;
}

export interface DashboardStats {
  durumSayilari: Record<HakedisStatus, number>;
  sonHakedisler: DashboardHakedisRow[];
  firmaSayisi?: number;
}

const DURUMLAR: HakedisStatus[] = ["taslak", "incelemede", "revizyon_istendi", "onaylandi", "silindi"];

export async function getDashboardStats(profile: Profile): Promise<DashboardStats> {
  const supabase = await createClient();

  // Durum başına ayrı count() sorgusu atmak yerine (5 ayrı ağ isteği),
  // tüm durumları tek sorguda çekip JS tarafında sayıyoruz — Supabase'e
  // gidiş-dönüş sayısını azaltır, sayfa yüklemesini hızlandırır.
  const [sonHakedislerResult, tumDurumlarResult, firmaSayimSonucu] = await Promise.all([
    supabase
      .from("hakedisler")
      .select("id, hakedis_no, donem_baslangic, donem_bitis, status, revizyon_sayisi, companies(name)")
      .order("created_at", { ascending: false })
      .limit(8),
    supabase.from("hakedisler").select("status"),
    profile.role === "admin"
      ? supabase.from("companies").select("id", { count: "exact", head: true })
      : Promise.resolve({ count: undefined }),
  ]);

  const durumSayilari = DURUMLAR.reduce((acc, durum) => {
    acc[durum] = 0;
    return acc;
  }, {} as Record<HakedisStatus, number>);
  for (const row of (tumDurumlarResult.data ?? []) as { status: HakedisStatus }[]) {
    durumSayilari[row.status] = (durumSayilari[row.status] ?? 0) + 1;
  }

  return {
    durumSayilari,
    sonHakedisler: (sonHakedislerResult.data ?? []) as unknown as DashboardHakedisRow[],
    firmaSayisi: firmaSayimSonucu.count ?? undefined,
  };
}
