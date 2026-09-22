import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Hakedis, HakedisStatus, Profile } from "@/types/database";

export interface DashboardStats {
  durumSayilari: Record<HakedisStatus, number>;
  sonHakedisler: (Hakedis & { companies: { name: string } | null })[];
  firmaSayisi?: number;
  toplamOnaylananTutar: number;
}

const BOS_DURUM_SAYILARI: Record<HakedisStatus, number> = {
  taslak: 0,
  incelemede: 0,
  revizyon_istendi: 0,
  onaylandi: 0,
  silindi: 0,
};

export async function getDashboardStats(profile: Profile): Promise<DashboardStats> {
  const supabase = await createClient();

  const { data: hakedisler } = await supabase
    .from("hakedisler")
    .select("*, companies(name)")
    .order("created_at", { ascending: false });

  const rows = (hakedisler ?? []) as unknown as (Hakedis & { companies: { name: string } | null })[];

  const durumSayilari = { ...BOS_DURUM_SAYILARI };
  let toplamOnaylananTutar = 0;
  for (const row of rows) {
    durumSayilari[row.status]++;
    if (row.status === "onaylandi") toplamOnaylananTutar += row.net_tutar;
  }

  let firmaSayisi: number | undefined;
  if (profile.role === "admin") {
    const { count } = await supabase.from("companies").select("id", { count: "exact", head: true });
    firmaSayisi = count ?? 0;
  }

  return {
    durumSayilari,
    sonHakedisler: rows.slice(0, 8),
    firmaSayisi,
    toplamOnaylananTutar,
  };
}
