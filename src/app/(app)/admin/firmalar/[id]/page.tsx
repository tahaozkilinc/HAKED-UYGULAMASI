import { notFound } from "next/navigation";

import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getCompanyWithTags, listTags } from "@/lib/data/companies";
import type { Profile } from "@/types/database";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CompanyInfoForm } from "./info-form";
import { CompanyTagsForm } from "./tags-form";
import { CompanySchemaForm } from "./schema-form";
import { MuhendisAssignForm } from "./muhendis-form";

export default async function FirmaDetayPage(props: PageProps<"/admin/firmalar/[id]">) {
  const { id } = await props.params;
  await requireRole("admin");

  const [company, allTags] = await Promise.all([getCompanyWithTags(id), listTags()]);
  if (!company) notFound();

  const supabase = await createClient();
  const [{ data: muhendisler }, { data: atamalar }] = await Promise.all([
    supabase.from("profiles").select("*").eq("role", "muhendis").order("full_name"),
    supabase.from("muhendis_company_assignments").select("muhendis_id").eq("company_id", id),
  ]);

  const selectedTagIds = company.company_tags.map((ct) => ct.tags.id);
  const assignedIds = (atamalar ?? []).map((a) => a.muhendis_id);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">{company.name}</h1>
        <p className="text-sm text-muted-foreground">Firma bilgilerini, etiketlerini, hakediş form şablonunu ve mühendis atamalarını yönetin.</p>
      </div>

      <Tabs defaultValue="bilgiler">
        <TabsList>
          <TabsTrigger value="bilgiler">Bilgiler</TabsTrigger>
          <TabsTrigger value="etiketler">Etiketler</TabsTrigger>
          <TabsTrigger value="form">Hakediş Formu</TabsTrigger>
          <TabsTrigger value="muhendis">Mühendisler</TabsTrigger>
        </TabsList>

        <TabsContent value="bilgiler">
          <Card>
            <CardHeader>
              <CardTitle>Firma Bilgileri</CardTitle>
            </CardHeader>
            <CardContent>
              <CompanyInfoForm company={company} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="etiketler">
          <Card>
            <CardHeader>
              <CardTitle>İş Kolu Etiketleri</CardTitle>
            </CardHeader>
            <CardContent>
              <CompanyTagsForm companyId={company.id} allTags={allTags} selectedTagIds={selectedTagIds} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="form">
          <Card>
            <CardHeader>
              <CardTitle>Hakediş Kalem Şablonu</CardTitle>
            </CardHeader>
            <CardContent>
              <CompanySchemaForm companyId={company.id} schema={company.hakedis_schema} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="muhendis">
          <Card>
            <CardHeader>
              <CardTitle>Onay Yetkili Mühendisler</CardTitle>
            </CardHeader>
            <CardContent>
              <MuhendisAssignForm
                companyId={company.id}
                muhendisler={(muhendisler ?? []) as Profile[]}
                assignedIds={assignedIds}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
