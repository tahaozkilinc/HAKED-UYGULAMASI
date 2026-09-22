import { notFound } from "next/navigation";

import { requireRole } from "@/lib/auth";
import { getCompanyWithTags, listTags } from "@/lib/data/companies";
import { listHakedisler } from "@/lib/data/hakedisler";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CompanyInfoForm } from "./info-form";
import { CompanyLogoForm } from "./logo-form";
import { CompanyTagsForm } from "./tags-form";
import { CompanySchemaForm } from "./schema-form";
import { CompanyHakedislerPanel } from "./hakedisler-panel";

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default async function FirmaDetayPage(props: PageProps<"/admin/firmalar/[id]">) {
  const { id } = await props.params;
  const searchParams = await props.searchParams;
  await requireRole("admin");

  const from = typeof searchParams.from === "string" ? searchParams.from : undefined;
  const to = typeof searchParams.to === "string" ? searchParams.to : undefined;
  const tab = typeof searchParams.tab === "string" ? searchParams.tab : "bilgiler";

  const [company, allTags, hakedisler] = await Promise.all([
    getCompanyWithTags(id),
    listTags(),
    listHakedisler({
      companyId: id,
      baslangic: from ? `${from}T00:00:00` : undefined,
      bitis: to ? `${to}T23:59:59` : undefined,
    }),
  ]);
  if (!company) notFound();

  const selectedTagIds = company.company_tags.map((ct) => ct.tags.id);

  const today = new Date();
  const son1Ay = new Date(today);
  son1Ay.setDate(today.getDate() - 30);
  const yilBasi = new Date(today.getFullYear(), 0, 1);

  const presetler = {
    today: toDateInputValue(today),
    son1Ay: toDateInputValue(son1Ay),
    yilBasi: toDateInputValue(yilBasi),
  };

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">{company.name}</h1>
        <p className="text-sm text-muted-foreground">Firma bilgilerini, etiketlerini ve hakediş form şablonunu yönetin.</p>
      </div>

      <Tabs defaultValue={tab === "hakedisler" ? "hakedisler" : "bilgiler"}>
        <TabsList>
          <TabsTrigger value="bilgiler">Bilgiler</TabsTrigger>
          <TabsTrigger value="etiketler">Etiketler</TabsTrigger>
          <TabsTrigger value="form">Hakediş Formu</TabsTrigger>
          <TabsTrigger value="hakedisler">Hakedişler</TabsTrigger>
        </TabsList>

        <TabsContent value="bilgiler" className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Logo</CardTitle>
            </CardHeader>
            <CardContent>
              <CompanyLogoForm companyId={company.id} logoUrl={company.logo_url} />
            </CardContent>
          </Card>
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

        <TabsContent value="hakedisler">
          <Card>
            <CardHeader>
              <CardTitle>Hakedişler</CardTitle>
            </CardHeader>
            <CardContent>
              <CompanyHakedislerPanel
                companyId={company.id}
                hakedisler={hakedisler}
                from={from}
                to={to}
                presetler={presetler}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
