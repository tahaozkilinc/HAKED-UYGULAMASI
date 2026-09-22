import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Company, Profile } from "@/types/database";
import { ROL_ETIKETLERI } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { InviteUserDialog } from "./invite-user-dialog";
import { EditUserDialog } from "./edit-user-dialog";

export default async function KullanicilarPage() {
  await requireRole("admin");
  const supabase = await createClient();

  const [{ data: users }, { data: companies }] = await Promise.all([
    supabase.from("profiles").select("*").order("created_at", { ascending: false }),
    supabase.from("companies").select("id, name").order("name"),
  ]);

  const typedUsers = (users ?? []) as Profile[];
  const typedCompanies = (companies ?? []) as Pick<Company, "id" | "name">[];
  const companyMap = new Map(typedCompanies.map((c) => [c.id, c.name]));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">Kullanıcılar</h1>
          <p className="text-sm text-muted-foreground">
            Firma, mühendis, satın alma ve yönetici hesaplarını yönetin.
          </p>
        </div>
        <InviteUserDialog companies={typedCompanies} />
      </div>

      <Card>
        <CardContent className="pt-5">
          {typedUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground">Henüz kullanıcı yok.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ad Soyad</TableHead>
                    <TableHead>E-posta</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Firma</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {typedUsers.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.full_name || "-"}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{ROL_ETIKETLERI[u.role]}</Badge>
                      </TableCell>
                      <TableCell>{u.company_id ? companyMap.get(u.company_id) ?? "-" : "-"}</TableCell>
                      <TableCell>
                        <Badge variant={u.is_active ? "success" : "secondary"}>
                          {u.is_active ? "Aktif" : "Pasif"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <EditUserDialog user={u} companies={typedCompanies} />
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
