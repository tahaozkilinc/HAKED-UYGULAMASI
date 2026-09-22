"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";

type ActionState = { error?: string; success?: boolean } | undefined;

function parseKalemler(raw: string | null): { sira_no: number; data: Record<string, unknown>; tutar: number }[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

export async function createHakedis(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const profile = await requireProfile();
  const supabase = await createClient();

  const companyId = profile.role === "admin" ? String(formData.get("company_id") ?? "") : profile.company_id;
  if (!companyId) return { error: "Firma bulunamadı." };

  const gonder = formData.get("submit_action") === "gonder";
  const donemBaslangic = String(formData.get("donem_baslangic") ?? "");
  const donemBitis = String(formData.get("donem_bitis") ?? "");
  const aciklama = String(formData.get("aciklama") ?? "") || null;
  const kalemler = parseKalemler(String(formData.get("kalemler") ?? ""));

  if (!donemBaslangic || !donemBitis) return { error: "Dönem başlangıç ve bitiş tarihleri gereklidir." };

  const { data: hakedis, error } = await supabase
    .from("hakedisler")
    .insert({
      company_id: companyId,
      donem_baslangic: donemBaslangic,
      donem_bitis: donemBitis,
      aciklama,
      status: gonder ? "incelemede" : "taslak",
      created_by: profile.id,
    })
    .select("id")
    .single();

  if (error || !hakedis) {
    return { error: "Hakediş oluşturulamadı: " + (error?.message ?? "bilinmeyen hata") };
  }

  if (kalemler.length > 0) {
    const { error: kalemError } = await supabase.from("hakedis_kalemleri").insert(
      kalemler.map((k) => ({ hakedis_id: hakedis.id, sira_no: k.sira_no, data: k.data, tutar: k.tutar })),
    );
    if (kalemError) return { error: "Kalemler kaydedilemedi: " + kalemError.message };
  }

  revalidatePath("/hakedisler");
  revalidatePath("/");
  redirect(`/hakedisler/${hakedis.id}`);
}

export async function updateHakedis(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  await requireProfile();
  const supabase = await createClient();

  const id = String(formData.get("id") ?? "");
  const gonder = formData.get("submit_action") === "gonder";
  const donemBaslangic = String(formData.get("donem_baslangic") ?? "");
  const donemBitis = String(formData.get("donem_bitis") ?? "");
  const aciklama = String(formData.get("aciklama") ?? "") || null;
  const kalemler = parseKalemler(String(formData.get("kalemler") ?? ""));

  if (!id) return { error: "Hakediş bulunamadı." };

  const { error: updateError } = await supabase
    .from("hakedisler")
    .update({
      donem_baslangic: donemBaslangic,
      donem_bitis: donemBitis,
      aciklama,
      status: gonder ? "incelemede" : "taslak",
    })
    .eq("id", id);

  if (updateError) return { error: "Hakediş güncellenemedi: " + updateError.message };

  await supabase.from("hakedis_kalemleri").delete().eq("hakedis_id", id);
  if (kalemler.length > 0) {
    const { error: kalemError } = await supabase.from("hakedis_kalemleri").insert(
      kalemler.map((k) => ({ hakedis_id: id, sira_no: k.sira_no, data: k.data, tutar: k.tutar })),
    );
    if (kalemError) return { error: "Kalemler kaydedilemedi: " + kalemError.message };
  }

  revalidatePath(`/hakedisler/${id}`);
  revalidatePath("/hakedisler");
  revalidatePath("/");
  redirect(`/hakedisler/${id}`);
}

export async function muhendisKarar(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  await requireProfile();
  const supabase = await createClient();

  const id = String(formData.get("id") ?? "");
  const karar = String(formData.get("karar") ?? "");
  const not = String(formData.get("not") ?? "") || null;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (karar === "onayla") {
    const { error } = await supabase
      .from("hakedisler")
      .update({ status: "onaylandi", karar_veren_id: user?.id, muhendis_id: user?.id })
      .eq("id", id);
    if (error) return { error: "Onaylanamadı: " + error.message };
  } else if (karar === "revizyon") {
    if (!not) return { error: "Revizyon talebinde bir açıklama girmelisiniz." };
    const { error } = await supabase
      .from("hakedisler")
      .update({
        status: "revizyon_istendi",
        son_revizyon_notu: not,
        karar_veren_id: user?.id,
        muhendis_id: user?.id,
      })
      .eq("id", id);
    if (error) return { error: "Revizyon talebi gönderilemedi: " + error.message };
  } else if (karar === "sil") {
    const { error } = await supabase
      .from("hakedisler")
      .update({ status: "silindi", karar_veren_id: user?.id, muhendis_id: user?.id, son_revizyon_notu: not })
      .eq("id", id);
    if (error) return { error: "Hakediş silinemedi: " + error.message };
  } else {
    return { error: "Geçersiz işlem." };
  }

  revalidatePath(`/hakedisler/${id}`);
  revalidatePath("/hakedisler");
  revalidatePath("/");
  return { success: true };
}

export async function yorumEkle(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const profile = await requireProfile();
  const supabase = await createClient();

  const id = String(formData.get("id") ?? "");
  const yorum = String(formData.get("yorum") ?? "").trim();
  if (!yorum) return { error: "Yorum boş olamaz." };

  const { error } = await supabase.from("hakedis_hareketleri").insert({
    hakedis_id: id,
    islem_tipi: "yorum",
    aciklama: yorum,
    yapan_id: profile.id,
  });

  if (error) return { error: "Yorum eklenemedi: " + error.message };

  revalidatePath(`/hakedisler/${id}`);
  return { success: true };
}

export async function ekYukle(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const profile = await requireProfile();
  const supabase = await createClient();

  const id = String(formData.get("id") ?? "");
  const file = formData.get("dosya") as File | null;
  if (!file || file.size === 0) return { error: "Dosya seçilmedi." };

  const path = `${id}/${Date.now()}-${file.name}`;
  const { error: uploadError } = await supabase.storage.from("hakedis-ekler").upload(path, file);
  if (uploadError) return { error: "Dosya yüklenemedi: " + uploadError.message };

  const { error } = await supabase.from("hakedis_ekler").insert({
    hakedis_id: id,
    dosya_adi: file.name,
    storage_path: path,
    boyut: file.size,
    yukleyen_id: profile.id,
  });

  if (error) return { error: "Ek kaydedilemedi: " + error.message };

  revalidatePath(`/hakedisler/${id}`);
  return { success: true };
}
