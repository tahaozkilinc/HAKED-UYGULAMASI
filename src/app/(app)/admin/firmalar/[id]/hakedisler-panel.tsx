import Link from "next/link";
import { Download } from "lucide-react";

import type { HakedisListItem } from "@/lib/data/hakedisler";
import { formatTarih } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge, RevizyonUyarisi } from "@/components/hakedis/status-badge";

interface CompanyHakedislerPanelProps {
  companyId: string;
  hakedisler: HakedisListItem[];
  from: string | undefined;
  to: string | undefined;
  presetler: { today: string; son1Ay: string; yilBasi: string };
}

export function CompanyHakedislerPanel({ companyId, hakedisler, from, to, presetler }: CompanyHakedislerPanelProps) {
  const exportHref = `/admin/firmalar/${companyId}/hakedisler/export${
    from || to ? `?${new URLSearchParams({ ...(from ? { from } : {}), ...(to ? { to } : {}) }).toString()}` : ""
  }`;

  const presetHref = (baslangic?: string, bitis?: string) => {
    const params = new URLSearchParams({ tab: "hakedisler" });
    if (baslangic) params.set("from", baslangic);
    if (bitis) params.set("to", bitis);
    return `/admin/firmalar/${companyId}?${params.toString()}`;
  };

  const aktifPreset =
    from === presetler.son1Ay && to === presetler.today
      ? "son1Ay"
      : from === presetler.yilBasi && to === presetler.today
        ? "yilBasi"
        : !from && !to
          ? "hepsi"
          : "ozel";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" variant={aktifPreset === "hepsi" ? "default" : "outline"}>
            <Link href={presetHref()}>Tüm Zamanlar</Link>
          </Button>
          <Button asChild size="sm" variant={aktifPreset === "son1Ay" ? "default" : "outline"}>
            <Link href={presetHref(presetler.son1Ay, presetler.today)}>Son 1 Ay</Link>
          </Button>
          <Button asChild size="sm" variant={aktifPreset === "yilBasi" ? "default" : "outline"}>
            <Link href={presetHref(presetler.yilBasi, presetler.today)}>Yıl Başından Beri</Link>
          </Button>
        </div>

        <Button asChild size="sm" variant="outline">
          <a href={exportHref}>
            <Download className="size-4" /> Excel İndir
          </a>
        </Button>
      </div>

      <form method="get" className="flex flex-wrap items-end gap-3">
        <input type="hidden" name="tab" value="hakedisler" />
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="from" className="text-xs">
            Başlangıç
          </Label>
          <Input id="from" name="from" type="date" defaultValue={from} className="w-40" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="to" className="text-xs">
            Bitiş
          </Label>
          <Input id="to" name="to" type="date" defaultValue={to} className="w-40" />
        </div>
        <Button type="submit" size="sm" variant="secondary">
          Filtrele
        </Button>
      </form>

      <p className="text-sm text-muted-foreground">
        Bu tarih aralığında <span className="font-medium text-foreground">{hakedisler.length}</span> hakediş bulundu.
      </p>

      {hakedisler.length === 0 ? (
        <p className="text-sm text-muted-foreground">Bu filtreye uygun hakediş bulunamadı.</p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No</TableHead>
                <TableHead>Dönem</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Oluşturulma</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {hakedisler.map((h) => (
                <TableRow key={h.id}>
                  <TableCell>#{h.hakedis_no}</TableCell>
                  <TableCell>
                    {formatTarih(h.donem_baslangic)} – {formatTarih(h.donem_bitis)}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <StatusBadge status={h.status} />
                      <RevizyonUyarisi sayi={h.revizyon_sayisi} />
                    </div>
                  </TableCell>
                  <TableCell>{formatTarih(h.created_at)}</TableCell>
                  <TableCell>
                    <Link href={`/hakedisler/${h.id}`} className="text-sm text-primary hover:underline">
                      Görüntüle
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
