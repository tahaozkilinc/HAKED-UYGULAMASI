import { notFound } from "next/navigation";

import { requireRole } from "@/lib/auth";
import { getCompanyWithTags, listTags } from "@/lib/data/companies";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CompanyInfoForm } from "./info-form";
import { CompanyTagsForm } from "./tags-form";
import { CompanySchemaForm } from "./schema-form";

export default async function FirmaDetayPage(props: PageProps<"/admin/firmalar/[id]">) {
  const { id } = await props.params;
  await requireRole("admin");

  const [company, allTags] = await Promise.all([getCompanyWithTags(id), listTags()]);
  if (!company) notFound();

  const selectedTagIds = company.company_tags.map((ct) => ct.tags.id);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">{company.name}</h1>
        <p className="text-sm text-muted-foreground">Firma bilgilerini, etiketlerini ve hakediş form şablonunu yönetin.</p>
      </div>

      <Tabs defaultValue="bilgiler">
        <TabsList>
          <TabsTrigger value="bilgiler">Bilgiler</TabsTrigger>
          <TabsTrigger value="etiketler">Etiketler</TabsTrigger>
          <TabsTrigger value="form">Hakediş Formu</TabsTrigger>
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
      </Tabs>
    </div>
  );
}
