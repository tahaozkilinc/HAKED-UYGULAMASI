import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Company, Profile, Tag } from "@/types/database";

export interface CompanyWithTags extends Company {
  company_tags: { tags: Tag }[];
}

export type MuhendisOzet = Pick<Profile, "id" | "full_name" | "email">;

export async function listMuhendislerForCompany(companyId: string): Promise<MuhendisOzet[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("muhendis_company_assignments")
    .select("profiles(id, full_name, email)")
    .eq("company_id", companyId);
  if (error) throw error;
  return ((data ?? []) as unknown as { profiles: MuhendisOzet }[])
    .map((row) => row.profiles)
    .filter(Boolean);
}

/** Admin akışı: tüm firmalar için atanmış mühendisleri tek sorguda getirir. */
export async function listMuhendislerByCompany(): Promise<Record<string, MuhendisOzet[]>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("muhendis_company_assignments")
    .select("company_id, profiles(id, full_name, email)");
  if (error) throw error;

  const map: Record<string, MuhendisOzet[]> = {};
  for (const row of (data ?? []) as unknown as { company_id: string; profiles: MuhendisOzet }[]) {
    if (!row.profiles) continue;
    (map[row.company_id] ??= []).push(row.profiles);
  }
  return map;
}

export async function listCompaniesWithTags(): Promise<CompanyWithTags[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("companies")
    .select("*, company_tags(tags(*))")
    .order("name");
  if (error) throw error;
  return (data ?? []) as unknown as CompanyWithTags[];
}

export async function getCompanyWithTags(id: string): Promise<CompanyWithTags | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("companies")
    .select("*, company_tags(tags(*))")
    .eq("id", id)
    .single();
  if (error) return null;
  return data as unknown as CompanyWithTags;
}

export async function listTags(): Promise<Tag[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("tags").select("*").order("name");
  if (error) throw error;
  return (data ?? []) as Tag[];
}
