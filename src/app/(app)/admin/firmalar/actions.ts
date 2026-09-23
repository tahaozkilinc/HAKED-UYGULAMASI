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

  revalidatePath("/admin");
  redirect(`/admin/firmalar/${data.id}`);
}

export async function updateCompanyInfo(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  await requireRole("admin");
  const supabase = await createClient();

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!id || !name) return { error: "Geçersiz istek." };

  const { data, error } = await supabase
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
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) return { error: "Firma güncellenemedi: " + error.message };
  if (!data) {
    return {
      error:
        "Firma güncellenemedi: değişiklik veritabanına yazılmadı. Hesabınızın admin yetkisi olmayabilir (profiles.role = 'admin' olmalı) ya da veritabanı erişim kuralları (RLS migration'ları) eksik olabilir.",
    };
  }

  revalidatePath(`/admin/firmalar/${id}`);
  revalidatePath("/admin");
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

  const { data, error } = await supabase
    .from("companies")
    .update({ hakedis_schema: schema })
    .eq("id", id)
    .select("id")
    .maybeSingle();
  if (error) return { error: "Form şeması kaydedilemedi: " + error.message };
  if (!data) return { error: "Form şeması kaydedilemedi: değişiklik veritabanına yazılmadı (yetki sorunu olabilir)." };

  revalidatePath(`/admin/firmalar/${id}`);
  return { success: true };
}

export async function updateCompanyLogo(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  await requireRole("admin");
  const supabase = await createClient();

  const id = String(formData.get("id") ?? "");
  const file = formData.get("logo") as File | null;
  if (!id) return { error: "Geçersiz istek." };
  if (!file || file.size === 0) return { error: "Logo dosyası seçilmedi." };
  if (!file.type.startsWith("image/")) return { error: "Sadece resim dosyası yükleyebilirsiniz." };

  const uzanti = file.name.split(".").pop() || "png";
  const path = `${id}/logo-${Date.now()}.${uzanti}`;

  const { error: uploadError } = await supabase.storage
    .from("firma-logolari")
    .upload(path, file, { upsert: true });
  if (uploadError) return { error: "Logo yüklenemedi: " + uploadError.message };

  const {
    data: { publicUrl },
  } = supabase.storage.from("firma-logolari").getPublicUrl(path);

  const { data, error } = await supabase
    .from("companies")
    .update({ logo_url: publicUrl })
    .eq("id", id)
    .select("id")
    .maybeSingle();
  if (error) return { error: "Logo kaydedilemedi: " + error.message };
  if (!data) return { error: "Logo kaydedilemedi: değişiklik veritabanına yazılmadı (yetki sorunu olabilir)." };

  revalidatePath(`/admin/firmalar/${id}`);
  revalidatePath("/admin");
  return { success: true };
}

export async function removeCompanyLogo(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  await requireRole("admin");
  const supabase = await createClient();

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Geçersiz istek." };

  const { data, error } = await supabase
    .from("companies")
    .update({ logo_url: null })
    .eq("id", id)
    .select("id")
    .maybeSingle();
  if (error) return { error: "Logo kaldırılamadı: " + error.message };
  if (!data) return { error: "Logo kaldırılamadı: değişiklik veritabanına yazılmadı (yetki sorunu olabilir)." };

  revalidatePath(`/admin/firmalar/${id}`);
  revalidatePath("/admin");
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
  revalidatePath("/admin");
  return { success: true };
}
