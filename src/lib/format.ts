export function formatPara(tutar: number | null | undefined, currency = "TRY") {
  if (tutar === null || tutar === undefined) return "-";
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(tutar);
}

export function formatTarih(tarih: string | null | undefined) {
  if (!tarih) return "-";
  return new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium" }).format(
    new Date(tarih),
  );
}

export function formatTarihSaat(tarih: string | null | undefined) {
  if (!tarih) return "-";
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(tarih));
}

export function formatSayi(deger: number | null | undefined) {
  if (deger === null || deger === undefined) return "-";
  return new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 4 }).format(deger);
}
