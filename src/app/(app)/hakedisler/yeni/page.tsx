import { redirect } from "next/navigation";

import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { listAllMuhendisler } from "@/lib/data/companies";
import type { Company } from "@/types/database";
import { HakedisForm } from "@/components/hakedis/hakedis-form";
import { createHakedis } from "../actions";

export default async function YeniHakedisPage() {
  const profile = await requireProfile();
  if (profile.role !== "firma" && profile.role !== "admin") redirect("/hakedisler");

  const supabase = await createClient();

  if (profile.role === "firma") {
    if (!profile.company_id) {
      return <p className="text-sm text-muted-foreground">Hesabınız henüz bir firmaya bağlanmamış. Lütfen yöneticinizle iletişime geçin.</p>;
    }
    const [{ data: company }, muhendisler] = await Promise.all([
      supabase.from("companies").select("*").eq("id", profile.company_id).single(),
      listAllMuhendisler(),
    ]);

    if (!company) {
      return <p className="text-sm text-muted-foreground">Firma bilgisi bulunamadı.</p>;
    }

    return (
      <div className="mx-auto flex max-w-4xl flex-col gap-4">
        <h1 className="text-2xl font-semibold">Yeni Hakediş</h1>
        <HakedisForm action={createHakedis} company={company as Company} muhendisler={muhendisler} />
      </div>
    );
  }

  const [{ data: companies }, muhendisler] = await Promise.all([
    supabase.from("companies").select("*").eq("is_active", true).order("name"),
    listAllMuhendisler(),
  ]);
  const typedCompanies = (companies ?? []) as Company[];

  if (typedCompanies.length === 0) {
    return <p className="text-sm text-muted-foreground">Sistemde henüz tanımlı firma yok. Önce &quot;Firmalar&quot; sayfasından firma ekleyin.</p>;
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4">
      <h1 className="text-2xl font-semibold">Yeni Hakediş</h1>
      <HakedisForm
        action={createHakedis}
        company={typedCompanies[0]}
        companies={typedCompanies}
        muhendisler={muhendisler}
      />
    </div>
  );
}
