import { renderToBuffer } from "@react-pdf/renderer";

import { requireProfile } from "@/lib/auth";
import { getHakedisDetail } from "@/lib/data/hakedisler";
import { HakedisPdfDocument } from "@/lib/pdf/hakedis-pdf";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireProfile();
  const { id } = await params;

  const detail = await getHakedisDetail(id);
  if (!detail) {
    return new Response("Hakediş bulunamadı", { status: 404 });
  }

  const buffer = await renderToBuffer(
    HakedisPdfDocument({
      hakedis: detail.hakedis,
      company: detail.company,
      kalemler: detail.kalemler,
      olusturanAdi: detail.olusturan?.full_name || detail.olusturan?.email || "-",
      muhendisAdi: detail.muhendis?.full_name || detail.muhendis?.email || null,
    }),
  );

  const dosyaAdi = `${detail.company.short_code || detail.company.name}-hakedis-${detail.hakedis.hakedis_no}.pdf`
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "-");

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${dosyaAdi}"`,
    },
  });
}
