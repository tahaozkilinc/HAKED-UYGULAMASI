import Link from "next/link";

import { requireProfile } from "@/lib/auth";
import { listHakedisler } from "@/lib/data/hakedisler";
import type { HakedisStatus } from "@/types/database";
import { DURUM_ETIKETLERI } from "@/lib/constants";
import { formatPara, formatTarih } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge, RevizyonUyarisi } from "@/components/hakedis/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const DURUM_SEKMELERI: { key: HakedisStatus | "hepsi"; label: string }[] = [
  { key: "hepsi", label: "Hepsi" },
  { key: "incelemede", label: DURUM_ETIKETLERI.incelemede },
  { key: "revizyon_istendi", label: DURUM_ETIKETLERI.revizyon_istendi },
  { key: "onaylandi", label: DURUM_ETIKETLERI.onaylandi },
  { key: "taslak", label: DURUM_ETIKETLERI.taslak },
];

export default async function HakedislerPage(props: PageProps<"/hakedisler">) {
  const searchParams = await props.searchParams;
  const profile = await requireProfile();
  const durum = typeof searchParams.durum === "string" ? (searchParams.durum as HakedisStatus) : undefined;

  const hakedisler = await listHakedisler({ status: durum });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">
          {profile.role === "firma" ? "Hakedişlerim" : "Hakedişler"}
        </h1>
        {profile.role === "firma" && (
          <Button asChild>
            <Link href="/hakedisler/yeni">Yeni Hakediş</Link>
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {DURUM_SEKMELERI.map((sekme) => {
          const href = sekme.key === "hepsi" ? "/hakedisler" : `/hakedisler?durum=${sekme.key}`;
          const aktif = (sekme.key === "hepsi" && !durum) || sekme.key === durum;
          return (
            <Button key={sekme.key} asChild variant={aktif ? "default" : "outline"} size="sm">
              <Link href={href}>{sekme.label}</Link>
            </Button>
          );
        })}
      </div>

      <Card>
        <CardContent className="pt-5">
          {hakedisler.length === 0 ? (
            <p className="text-sm text-muted-foreground">Bu filtreye uygun hakediş bulunamadı.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Firma</TableHead>
                    <TableHead>No</TableHead>
                    <TableHead>Dönem</TableHead>
                    <TableHead>Net Tutar</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {hakedisler.map((h) => (
                    <TableRow key={h.id}>
                      <TableCell className="font-medium">
                        {h.companies?.name ?? "-"}
                        {h.companies?.short_code && (
                          <span className="ml-1 text-xs text-muted-foreground">({h.companies.short_code})</span>
                        )}
                      </TableCell>
                      <TableCell>#{h.hakedis_no}</TableCell>
                      <TableCell>
                        {formatTarih(h.donem_baslangic)} – {formatTarih(h.donem_bitis)}
                      </TableCell>
                      <TableCell className="tabular-nums">{formatPara(h.net_tutar)}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <StatusBadge status={h.status} />
                          <RevizyonUyarisi sayi={h.revizyon_sayisi} />
                        </div>
                      </TableCell>
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
        </CardContent>
      </Card>
    </div>
  );
}
