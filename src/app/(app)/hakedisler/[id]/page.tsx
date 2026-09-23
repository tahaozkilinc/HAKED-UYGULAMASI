import Link from "next/link";
import { notFound } from "next/navigation";
import { Download, FileText } from "lucide-react";

import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getHakedisDetail } from "@/lib/data/hakedisler";
import { DUZENLENEBILIR_DURUMLAR, HAREKET_ETIKETLERI, ROL_ETIKETLERI } from "@/lib/constants";
import { formatTarih, formatTarihSaat } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { StatusBadge, RevizyonUyarisi } from "@/components/hakedis/status-badge";
import { KalemForm } from "@/components/hakedis/kalem-form";
import { MuhendisKararPanel } from "@/components/hakedis/muhendis-karar-panel";
import { YorumForm } from "@/components/hakedis/yorum-form";
import { EkYukleForm } from "@/components/hakedis/ek-yukle-form";

export default async function HakedisDetayPage(props: PageProps<"/hakedisler/[id]">) {
  const { id } = await props.params;
  const [profile, detail] = await Promise.all([requireProfile(), getHakedisDetail(id)]);

  if (!detail) notFound();

  const { hakedis, company, kalemler, ekler, hareketler, olusturan, muhendis } = detail;
  const supabase = await createClient();

  // Her ek için ayrı ayrı signed URL istemek yerine (N ağ isteği), Supabase'in
  // toplu imzalama API'siyle tek istekte alıyoruz.
  const { data: signedUrlData } = ekler.length
    ? await supabase.storage.from("hakedis-ekler").createSignedUrls(
        ekler.map((ek) => ek.storage_path),
        60 * 30,
      )
    : { data: [] as { path: string | null; signedUrl: string }[] };
  const ekSignedUrls = ekler.map((ek, i) => ({ ...ek, url: signedUrlData?.[i]?.signedUrl ?? null }));
  const muhendisYetkili = profile.role === "muhendis" && hakedis.muhendis_id === profile.id;

  const firmaDuzenleyebilir =
    (profile.role === "firma" && profile.company_id === company.id) || profile.role === "admin";
  const gosterDuzenle = firmaDuzenleyebilir && DUZENLENEBILIR_DURUMLAR.includes(hakedis.status);
  const gosterMuhendisPaneli = muhendisYetkili && hakedis.status === "incelemede";

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold">
              {company.name} — Hakediş #{hakedis.hakedis_no}
            </h1>
            <StatusBadge status={hakedis.status} />
            <RevizyonUyarisi sayi={hakedis.revizyon_sayisi} />
          </div>
          <p className="text-sm text-muted-foreground">
            Dönem: {formatTarih(hakedis.donem_baslangic)} – {formatTarih(hakedis.donem_bitis)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <a href={`/hakedisler/${id}/pdf`}>
              <Download className="size-4" /> PDF İndir
            </a>
          </Button>
          {gosterDuzenle && (
            <Button asChild>
              <Link href={`/hakedisler/${id}/duzenle`}>Düzenle</Link>
            </Button>
          )}
        </div>
      </div>

      {hakedis.status === "revizyon_istendi" && hakedis.son_revizyon_notu && (
        <div className="rounded-md border border-warning/40 bg-warning/10 p-3 text-sm">
          <p className="font-medium">Mühendisin revizyon notu:</p>
          <p className="text-muted-foreground">{hakedis.son_revizyon_notu}</p>
        </div>
      )}

      {gosterMuhendisPaneli && (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle>Mühendis Kararı</CardTitle>
          </CardHeader>
          <CardContent>
            <MuhendisKararPanel id={id} />
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Hakediş Kalemleri</CardTitle>
          </CardHeader>
          <CardContent>
            <KalemForm schema={company.hakedis_schema} name="_readonly" defaultItems={kalemler} readOnly />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Detaylar</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground">Firma</span>
              <span className="font-medium">{company.name}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground">Dönem</span>
              <span>
                {formatTarih(hakedis.donem_baslangic)} – {formatTarih(hakedis.donem_bitis)}
              </span>
            </div>
            {muhendis && (
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground">İlgili Mühendis</span>
                <span className="font-medium">{muhendis.full_name || muhendis.email}</span>
              </div>
            )}
            {hakedis.aciklama && (
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground">Açıklama</span>
                <span>{hakedis.aciklama}</span>
              </div>
            )}
            <Separator />
            <div className="flex flex-col gap-1 text-xs text-muted-foreground">
              <span>Oluşturan: {olusturan?.full_name || olusturan?.email || "-"}</span>
              {hakedis.karar_tarihi && muhendis && (
                <span>Karar tarihi: {formatTarihSaat(hakedis.karar_tarihi)}</span>
              )}
              <span>Oluşturulma: {formatTarihSaat(hakedis.created_at)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ekler</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {ekSignedUrls.length === 0 ? (
            <p className="text-sm text-muted-foreground">Henüz dosya eklenmedi.</p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {ekSignedUrls.map((ek) => (
                <li key={ek.id} className="flex items-center gap-2 text-sm">
                  <FileText className="size-4 text-muted-foreground" />
                  {ek.url ? (
                    <a href={ek.url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                      {ek.dosya_adi}
                    </a>
                  ) : (
                    <span>{ek.dosya_adi}</span>
                  )}
                  <span className="text-xs text-muted-foreground">{formatTarih(ek.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
          <EkYukleForm id={id} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Hareket Geçmişi</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <YorumForm id={id} />
          <Separator />
          <ol className="flex flex-col gap-3">
            {hareketler.map((h) => (
              <li key={h.id} className="flex gap-3 text-sm">
                <div className="mt-1 size-2 shrink-0 rounded-full bg-primary" />
                <div>
                  <p>
                    <span className="font-medium">{HAREKET_ETIKETLERI[h.islem_tipi]}</span>
                    {h.profiles && (
                      <span className="text-muted-foreground">
                        {" "}
                        · {h.profiles.full_name} ({ROL_ETIKETLERI[h.profiles.role]})
                      </span>
                    )}
                  </p>
                  {h.aciklama && <p className="text-muted-foreground">{h.aciklama}</p>}
                  <p className="text-xs text-muted-foreground">{formatTarihSaat(h.created_at)}</p>
                </div>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
