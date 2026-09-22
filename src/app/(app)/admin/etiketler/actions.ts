"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";

type ActionState = { error?: string; success?: boolean } | undefined;

export async function createTag(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  await requireRole("admin");
  const supabase = await createClient();

  const name = String(formData.get("name") ?? "").trim();
  const color = String(formData.get("color") ?? "#64748b");
  if (!name) return { error: "Etiket adı gereklidir." };

  const { error } = await supabase.from("tags").insert({ name, color });
  if (error) return { error: error.code === "23505" ? "Bu isimde bir etiket zaten var." : error.message };

  revalidatePath("/admin/etiketler");
  return { success: true };
}

export async function deleteTag(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  await requireRole("admin");
  const supabase = await createClient();

  const id = String(formData.get("id") ?? "");
  const { error } = await supabase.from("tags").delete().eq("id", id);
  if (error) return { error: "Etiket silinemedi: " + error.message };

  revalidatePath("/admin/etiketler");
  return { success: true };
}
