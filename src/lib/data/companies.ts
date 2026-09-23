import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Company, CompanyContact, Profile, Tag } from "@/types/database";

export interface CompanyWithTags extends Company {
  company_tags: { tags: Tag }[];
}

export type MuhendisOzet = Pick<Profile, "id" | "full_name" | "email">;

/** Sistemdeki tüm mühendisler — hakediş açan firma bunlardan birini seçer. */
export async function listAllMuhendisler(): Promise<MuhendisOzet[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("role", "muhendis")
    .order("full_name");
  if (error) throw error;
  return (data ?? []) as MuhendisOzet[];
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

export async function listCompanyContacts(companyId: string): Promise<CompanyContact[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("company_contacts")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at");
  if (error) throw error;
  return (data ?? []) as CompanyContact[];
}

export async function listTags(): Promise<Tag[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("tags").select("*").order("name");
  if (error) throw error;
  return (data ?? []) as Tag[];
}
