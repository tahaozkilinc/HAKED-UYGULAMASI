"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth";
import type { UserRole } from "@/types/database";

type ActionState = { error?: string; success?: boolean } | undefined;

export async function inviteUser(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  await requireRole("admin");

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const fullName = String(formData.get("full_name") ?? "").trim();
  const role = String(formData.get("role") ?? "firma") as UserRole;
  const companyId = String(formData.get("company_id") ?? "") || null;
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const password = String(formData.get("password") ?? "");

  if (!email || !fullName) return { error: "Ad soyad ve e-posta gereklidir." };
  if (role === "firma" && !companyId) return { error: "Firma rolündeki kullanıcı için bir firma seçmelisiniz." };
  if (password.length < 8) return { error: "Şifre en az 8 karakter olmalıdır." };

  let admin;
  try {
    admin = createAdminClient();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Yönetim istemcisi oluşturulamadı." };
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, role, company_id: companyId },
  });

  if (error || !data.user) {
    return { error: "Kullanıcı oluşturulamadı: " + (error?.message ?? "bilinmeyen hata") };
  }

  if (phone) {
    await admin.from("profiles").update({ phone }).eq("id", data.user.id);
  }

  revalidatePath("/admin");
  return { success: true };
}

export async function setUserPassword(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  await requireRole("admin");

  const id = String(formData.get("id") ?? "");
  const password = String(formData.get("password") ?? "");

  if (password.length < 8) return { error: "Şifre en az 8 karakter olmalıdır." };

  let admin;
  try {
    admin = createAdminClient();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Yönetim istemcisi oluşturulamadı." };
  }

  const { error } = await admin.auth.admin.updateUserById(id, { password });
  if (error) return { error: "Şifre güncellenemedi: " + error.message };

  return { success: true };
}

export async function updateUser(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  await requireRole("admin");
  const supabase = await createClient();

  const id = String(formData.get("id") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();
  const role = String(formData.get("role") ?? "firma") as UserRole;
  const companyId = String(formData.get("company_id") ?? "") || null;
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const isActive = formData.get("is_active") === "on";

  if (role === "firma" && !companyId) return { error: "Firma rolündeki kullanıcı için bir firma seçmelisiniz." };

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      role,
      company_id: role === "firma" ? companyId : null,
      phone,
      is_active: isActive,
    })
    .eq("id", id);

  if (error) return { error: "Kullanıcı güncellenemedi: " + error.message };

  revalidatePath("/admin");
  return { success: true };
}
