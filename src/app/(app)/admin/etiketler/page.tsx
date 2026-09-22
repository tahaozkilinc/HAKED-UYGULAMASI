import { requireRole } from "@/lib/auth";
import { listTags } from "@/lib/data/companies";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TagList } from "./tag-list";

export default async function EtiketlerPage() {
  await requireRole("admin");
  const tags = await listTags();

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Etiketler</h1>
        <p className="text-sm text-muted-foreground">
          Firmaların iş kolunu belirten etiketler (Vinç, İzolasyon, Elektrik…). Bir firmaya birden fazla etiket atanabilir.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tüm Etiketler</CardTitle>
        </CardHeader>
        <CardContent>
          <TagList tags={tags} />
        </CardContent>
      </Card>
    </div>
  );
}
