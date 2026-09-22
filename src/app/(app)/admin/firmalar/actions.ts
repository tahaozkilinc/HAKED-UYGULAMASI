"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import type { HakedisSchema } from "@/types/database";

type ActionState = { error?: string; success?: boolean } | undefined;

export async function createCompany(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  await requireRole("admin");
  const supabase = await createClient();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Firma adı gereklidir." };

  const { data, error } = await supabase
    .from("companies")
    .insert({
      name,
      short_code: String(formData.get("short_code") ?? "").trim() || null,
      tax_number: String(formData.get("tax_number") ?? "").trim() || null,
      contact_name: String(formData.get("contact_name") ?? "").trim() || null,
      contact_phone: String(formData.get("contact_phone") ?? "").trim() || null,
      contact_email: String(formData.get("contact_email") ?? "").trim() || null,
      contract_amount: formData.get("contract_amount") ? Number(formData.get("contract_amount")) : null,
      notes: String(formData.get("notes") ?? "").trim() || null,
    })
    .select("id")
    .single();

  if (error || !data) return { error: "Firma oluşturulamadı: " + (error?.message ?? "") };

  revalidatePath("/admin/firmalar");
  redirect(`/admin/firmalar/${data.id}`);
}

export async function updateCompanyInfo(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  await requireRole("admin");
  const supabase = await createClient();

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!id || !name) return { error: "Geçersiz istek." };

  const { error } = await supabase
    .from("companies")
    .update({
      name,
      short_code: String(formData.get("short_code") ?? "").trim() || null,
      tax_number: String(formData.get("tax_number") ?? "").trim() || null,
      contact_name: String(formData.get("contact_name") ?? "").trim() || null,
      contact_phone: String(formData.get("contact_phone") ?? "").trim() || null,
      contact_email: String(formData.get("contact_email") ?? "").trim() || null,
      contract_amount: formData.get("contract_amount") ? Number(formData.get("contract_amount")) : null,
      notes: String(formData.get("notes") ?? "").trim() || null,
      is_active: formData.get("is_active") === "on",
    })
    .eq("id", id);

  if (error) return { error: "Firma güncellenemedi: " + error.message };

  revalidatePath(`/admin/firmalar/${id}`);
  revalidatePath("/admin/firmalar");
  return { success: true };
}

export async function updateCompanySchema(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  await requireRole("admin");
  const supabase = await createClient();

  const id = String(formData.get("id") ?? "");
  const raw = String(formData.get("hakedis_schema") ?? "");
  let schema: HakedisSchema;
  try {
    schema = JSON.parse(raw);
  } catch {
    return { error: "Form şeması ayrıştırılamadı." };
  }

  const keys = schema.fields.map((f) => f.key);
  if (new Set(keys).size !== keys.length) {
    return { error: "Alan anahtarları benzersiz olmalıdır." };
  }

  const { error } = await supabase.from("companies").update({ hakedis_schema: schema }).eq("id", id);
  if (error) return { error: "Form şeması kaydedilemedi: " + error.message };

  revalidatePath(`/admin/firmalar/${id}`);
  return { success: true };
}

export async function setCompanyTags(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  await requireRole("admin");
  const supabase = await createClient();

  const id = String(formData.get("id") ?? "");
  const tagIds = formData.getAll("tag_ids").map(String);

  const { error: deleteError } = await supabase.from("company_tags").delete().eq("company_id", id);
  if (deleteError) return { error: "Etiketler güncellenemedi: " + deleteError.message };

  if (tagIds.length > 0) {
    const { error: insertError } = await supabase
      .from("company_tags")
      .insert(tagIds.map((tagId) => ({ company_id: id, tag_id: tagId })));
    if (insertError) return { error: "Etiketler güncellenemedi: " + insertError.message };
  }

  revalidatePath(`/admin/firmalar/${id}`);
  revalidatePath("/admin/firmalar");
  return { success: true };
}

export async function setMuhendisAssignments(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  await requireRole("admin");
  const supabase = await createClient();

  const companyId = String(formData.get("company_id") ?? "");
  const muhendisIds = formData.getAll("muhendis_ids").map(String);

  const { error: deleteError } = await supabase
    .from("muhendis_company_assignments")
    .delete()
    .eq("company_id", companyId);
  if (deleteError) return { error: "Atamalar güncellenemedi: " + deleteError.message };

  if (muhendisIds.length > 0) {
    const { error: insertError } = await supabase
      .from("muhendis_company_assignments")
      .insert(muhendisIds.map((muhendisId) => ({ company_id: companyId, muhendis_id: muhendisId })));
    if (insertError) return { error: "Atamalar güncellenemedi: " + insertError.message };
  }

  revalidatePath(`/admin/firmalar/${companyId}`);
  return { success: true };
}
