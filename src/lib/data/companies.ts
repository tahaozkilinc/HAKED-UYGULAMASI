import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Company, Tag } from "@/types/database";

export interface CompanyWithTags extends Company {
  company_tags: { tags: Tag }[];
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
