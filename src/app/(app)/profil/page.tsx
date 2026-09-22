import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ROL_ETIKETLERI } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileForm } from "./profile-form";
import { PasswordForm } from "./password-form";

export default async function ProfilPage() {
  const profile = await requireProfile();

  let companyName: string | null = null;
  if (profile.company_id) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("companies")
      .select("name")
      .eq("id", profile.company_id)
      .single();
    companyName = (data as { name: string } | null)?.name ?? null;
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Profilim</h1>
        <p className="text-sm text-muted-foreground">Hesap bilgilerinizi ve şifrenizi buradan yönetebilirsiniz.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Hesap Bilgileri</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{ROL_ETIKETLERI[profile.role]}</Badge>
            {companyName && <Badge variant="secondary">{companyName}</Badge>}
          </div>
          <ProfileForm profile={profile} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Şifre Değiştir</CardTitle>
        </CardHeader>
        <CardContent>
          <PasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}
