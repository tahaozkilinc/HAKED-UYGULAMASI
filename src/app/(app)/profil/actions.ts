"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";

type ActionState = { error?: string; success?: boolean } | undefined;

export async function updateOwnProfile(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const profile = await requireProfile();
  const supabase = await createClient();

  const fullName = String(formData.get("full_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim() || null;

  if (!fullName) return { error: "Ad soyad boş olamaz." };

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName, phone })
    .eq("id", profile.id);

  if (error) return { error: "Bilgiler güncellenemedi: " + error.message };

  revalidatePath("/profil");
  return { success: true };
}

export async function changeOwnPassword(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  await requireProfile();
  const supabase = await createClient();

  const password = String(formData.get("password") ?? "");
  const passwordAgain = String(formData.get("password_again") ?? "");

  if (password.length < 8) return { error: "Şifre en az 8 karakter olmalıdır." };
  if (password !== passwordAgain) return { error: "Şifreler birbiriyle uyuşmuyor." };

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: "Şifre değiştirilemedi: " + error.message };

  return { success: true };
}
