import type { HakedisStatus, HareketTipi, SchemaFieldType, UserRole } from "@/types/database";

export const ROL_ETIKETLERI: Record<UserRole, string> = {
  admin: "Yönetici",
  firma: "Firma",
  muhendis: "Mühendis",
  satin_alma: "Satın Alma",
};

export const ROL_ACIKLAMALARI: Record<UserRole, string> = {
  admin: "Sistem yöneticisi: firmalar, kullanıcılar ve form tanımlarını yönetir, tüm kayıtları görür.",
  firma: "Hakediş girer, revizyon istenirse düzenler.",
  muhendis: "Kendisine atanan firmaların hakedişlerini inceler, onaylar veya revizyon ister.",
  satin_alma: "Tüm süreci baştan sona izler; düzenleme yetkisi yoktur.",
};

export const DURUM_ETIKETLERI: Record<HakedisStatus, string> = {
  taslak: "Taslak",
  incelemede: "Mühendis İncelemesinde",
  revizyon_istendi: "Revizyon İstendi",
  onaylandi: "Onaylandı",
  silindi: "Silindi",
};

export const DURUM_RENKLERI: Record<HakedisStatus, "default" | "secondary" | "destructive" | "success" | "warning" | "outline"> = {
  taslak: "secondary",
  incelemede: "default",
  revizyon_istendi: "warning",
  onaylandi: "success",
  silindi: "destructive",
};

export const HAREKET_ETIKETLERI: Record<HareketTipi, string> = {
  olusturuldu: "Hakediş oluşturuldu",
  guncellendi: "Güncellendi",
  gonderildi: "İncelemeye gönderildi",
  revizyon_istendi: "Revizyon istendi",
  revize_edildi: "Revize edilip yeniden gönderildi",
  onaylandi: "Onaylandı",
  silindi: "Silindi",
  yorum: "Yorum",
  ek_eklendi: "Dosya eklendi",
};

export const ALAN_TIPI_ETIKETLERI: Record<SchemaFieldType, string> = {
  text: "Kısa Metin",
  textarea: "Uzun Metin",
  number: "Sayı",
  currency: "Tutar (₺)",
  date: "Tarih",
  select: "Seçim Listesi",
  computed: "Hesaplanan (formül)",
};

export const DUZENLENEBILIR_DURUMLAR: HakedisStatus[] = ["taslak", "revizyon_istendi"];

export const KDV_VARSAYILAN = 20;
