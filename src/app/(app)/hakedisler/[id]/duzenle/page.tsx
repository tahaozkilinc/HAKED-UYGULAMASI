import { notFound, redirect } from "next/navigation";

import { requireProfile } from "@/lib/auth";
import { getHakedisDetail } from "@/lib/data/hakedisler";
import { listAllMuhendisler } from "@/lib/data/companies";
import { DUZENLENEBILIR_DURUMLAR } from "@/lib/constants";
import { HakedisForm } from "@/components/hakedis/hakedis-form";
import { updateHakedis } from "../../actions";

export default async function HakedisDuzenlePage(props: PageProps<"/hakedisler/[id]/duzenle">) {
  const { id } = await props.params;
  const [profile, detail] = await Promise.all([requireProfile(), getHakedisDetail(id)]);

  if (!detail) notFound();

  const yetkili =
    profile.role === "admin" ||
    (profile.role === "firma" && profile.company_id === detail.company.id);

  if (!yetkili || !DUZENLENEBILIR_DURUMLAR.includes(detail.hakedis.status)) {
    redirect(`/hakedisler/${id}`);
  }

  const muhendisler = await listAllMuhendisler();

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4">
      <h1 className="text-2xl font-semibold">Hakediş #{detail.hakedis.hakedis_no} — Düzenle</h1>
      {detail.hakedis.status === "revizyon_istendi" && detail.hakedis.son_revizyon_notu && (
        <div className="rounded-md border border-warning/40 bg-warning/10 p-3 text-sm">
          <p className="font-medium">Mühendisin revizyon notu:</p>
          <p className="text-muted-foreground">{detail.hakedis.son_revizyon_notu}</p>
        </div>
      )}
      <HakedisForm
        action={updateHakedis}
        company={detail.company}
        muhendisler={muhendisler}
        defaultHakedis={detail.hakedis}
        defaultKalemler={detail.kalemler}
      />
    </div>
  );
}
