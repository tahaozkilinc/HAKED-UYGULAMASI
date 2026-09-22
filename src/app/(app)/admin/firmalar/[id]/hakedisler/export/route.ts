import ExcelJS from "exceljs";

import { requireRole } from "@/lib/auth";
import { getCompanyWithTags } from "@/lib/data/companies";
import { listHakedisler } from "@/lib/data/hakedisler";
import { DURUM_ETIKETLERI } from "@/lib/constants";
import { formatTarih, formatTarihSaat } from "@/lib/format";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireRole("admin");
  const { id } = await params;

  const company = await getCompanyWithTags(id);
  if (!company) {
    return new Response("Firma bulunamadı", { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from") || undefined;
  const to = searchParams.get("to") || undefined;

  const hakedisler = await listHakedisler({
    companyId: id,
    baslangic: from ? `${from}T00:00:00` : undefined,
    bitis: to ? `${to}T23:59:59` : undefined,
  });

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Hakedişler");

  sheet.columns = [
    { header: "No", key: "no", width: 8 },
    { header: "Dönem Başlangıç", key: "donemBaslangic", width: 16 },
    { header: "Dönem Bitiş", key: "donemBitis", width: 16 },
    { header: "Durum", key: "durum", width: 22 },
    { header: "Revizyon Sayısı", key: "revizyon", width: 14 },
    { header: "Oluşturulma", key: "olusturulma", width: 20 },
    { header: "Karar Tarihi", key: "kararTarihi", width: 20 },
  ];
  sheet.getRow(1).font = { bold: true };

  for (const h of hakedisler) {
    sheet.addRow({
      no: h.hakedis_no,
      donemBaslangic: formatTarih(h.donem_baslangic),
      donemBitis: formatTarih(h.donem_bitis),
      durum: DURUM_ETIKETLERI[h.status],
      revizyon: h.revizyon_sayisi,
      olusturulma: formatTarihSaat(h.created_at),
      kararTarihi: h.karar_tarihi ? formatTarihSaat(h.karar_tarihi) : "-",
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();

  const dosyaAdi = `${company.short_code || company.name}-hakedisler${from || to ? `-${from ?? "basi"}_${to ?? "sonu"}` : ""}.xlsx`
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "-");

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${dosyaAdi}"`,
    },
  });
}
