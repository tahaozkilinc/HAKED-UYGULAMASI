import Link from "next/link";
import { Building2, Clock, FileCheck2, FileStack, FileWarning } from "lucide-react";

import { requireProfile } from "@/lib/auth";
import { getDashboardStats } from "@/lib/data/dashboard";
import { DURUM_ETIKETLERI, ROL_ACIKLAMALARI, ROL_ETIKETLERI } from "@/lib/constants";
import { formatTarih } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge, RevizyonUyarisi } from "@/components/hakedis/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function DashboardPage() {
  const profile = await requireProfile();
  const stats = await getDashboardStats(profile);

  const kartlar = [
    {
      label: DURUM_ETIKETLERI.incelemede,
      value: stats.durumSayilari.incelemede,
      icon: Clock,
      hint: profile.role === "muhendis" ? "Onayınızı bekliyor" : "Mühendis onayı bekleniyor",
    },
    {
      label: DURUM_ETIKETLERI.revizyon_istendi,
      value: stats.durumSayilari.revizyon_istendi,
      icon: FileWarning,
      hint: "Firma düzenlemesi bekleniyor",
    },
    {
      label: DURUM_ETIKETLERI.onaylandi,
      value: stats.durumSayilari.onaylandi,
      icon: FileCheck2,
      hint: "Süreç tamamlandı",
    },
    profile.role === "admin"
      ? { label: "Kayıtlı Firma", value: stats.firmaSayisi ?? 0, icon: Building2, hint: "Aktif ve pasif firmalar" }
      : {
          label: "Toplam Hakediş",
          value: Object.values(stats.durumSayilari).reduce((a, b) => a + b, 0),
          icon: FileStack,
          hint: "Tüm durumlar dahil",
        },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Merhaba, {profile.full_name || profile.email}</h1>
        <p className="text-sm text-muted-foreground">
          {ROL_ETIKETLERI[profile.role]} · {ROL_ACIKLAMALARI[profile.role]}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kartlar.map((kart) => (
          <Card key={kart.label}>
            <CardContent className="flex items-center justify-between pt-5">
              <div>
                <p className="text-sm text-muted-foreground">{kart.label}</p>
                <p className="text-2xl font-semibold">{kart.value}</p>
                <p className="text-xs text-muted-foreground">{kart.hint}</p>
              </div>
              <kart.icon className="size-8 text-muted-foreground/40" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Son Hakedişler</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.sonHakedisler.length === 0 ? (
            <p className="text-sm text-muted-foreground">Henüz hakediş kaydı yok.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Firma</TableHead>
                    <TableHead>No</TableHead>
                    <TableHead>Dönem</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.sonHakedisler.map((h) => (
                    <TableRow key={h.id}>
                      <TableCell className="font-medium">{h.companies?.name ?? "-"}</TableCell>
                      <TableCell>#{h.hakedis_no}</TableCell>
                      <TableCell>
                        {formatTarih(h.donem_baslangic)} – {formatTarih(h.donem_bitis)}
                      </TableCell>
                      <TableCell className="flex flex-wrap items-center gap-1.5">
                        <StatusBadge status={h.status} />
                        <RevizyonUyarisi sayi={h.revizyon_sayisi} />
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
