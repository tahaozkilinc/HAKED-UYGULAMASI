import "server-only";

import { createClient } from "@/lib/supabase/server";
import type {
  Company,
  Hakedis,
  HakedisEk,
  HakedisHareket,
  HakedisKalemi,
  HakedisStatus,
  Profile,
} from "@/types/database";

export interface HakedisListItem extends Hakedis {
  companies: Pick<Company, "id" | "name" | "short_code"> | null;
}

export async function listHakedisler(filters?: {
  status?: HakedisStatus;
  companyId?: string;
}): Promise<HakedisListItem[]> {
  const supabase = await createClient();
  let query = supabase
    .from("hakedisler")
    .select("*, companies(id, name, short_code)")
    .order("created_at", { ascending: false });

  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.companyId) query = query.eq("company_id", filters.companyId);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as HakedisListItem[];
}

export interface HakedisDetail {
  hakedis: Hakedis;
  company: Company;
  kalemler: HakedisKalemi[];
  ekler: HakedisEk[];
  hareketler: (HakedisHareket & { profiles: Pick<Profile, "full_name" | "role"> | null })[];
  olusturan: Pick<Profile, "full_name" | "email"> | null;
  muhendis: Pick<Profile, "full_name" | "email"> | null;
}

export async function getHakedisDetail(id: string): Promise<HakedisDetail | null> {
  const supabase = await createClient();

  const { data: hakedis, error } = await supabase
    .from("hakedisler")
    .select("*, companies(*)")
    .eq("id", id)
    .single();

  if (error || !hakedis) return null;

  const { companies: company, ...hakedisRow } = hakedis as unknown as Hakedis & { companies: Company };

  const [{ data: kalemler }, { data: ekler }, { data: hareketler }, { data: olusturan }, { data: muhendis }] =
    await Promise.all([
      supabase.from("hakedis_kalemleri").select("*").eq("hakedis_id", id).order("sira_no"),
      supabase.from("hakedis_ekler").select("*").eq("hakedis_id", id).order("created_at"),
      supabase
        .from("hakedis_hareketleri")
        .select("*, profiles(full_name, role)")
        .eq("hakedis_id", id)
        .order("created_at", { ascending: false }),
      supabase.from("profiles").select("full_name, email").eq("id", hakedisRow.created_by).single(),
      hakedisRow.muhendis_id
        ? supabase.from("profiles").select("full_name, email").eq("id", hakedisRow.muhendis_id).single()
        : Promise.resolve({ data: null }),
    ]);

  return {
    hakedis: hakedisRow,
    company,
    kalemler: (kalemler ?? []) as HakedisKalemi[],
    ekler: (ekler ?? []) as HakedisEk[],
    hareketler: (hareketler ?? []) as unknown as HakedisDetail["hareketler"],
    olusturan: olusturan as HakedisDetail["olusturan"],
    muhendis: muhendis as HakedisDetail["muhendis"],
  };
}
