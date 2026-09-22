import Link from "next/link";

import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { listCompaniesWithTags, listTags } from "@/lib/data/companies";
import type { Company, Profile } from "@/types/database";
import { ROL_ETIKETLERI } from "@/lib/constants";
import { formatPara } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CompanyCreateDialog } from "./firmalar/company-create-dialog";
import { TagList } from "./etiketler/tag-list";
import { InviteUserDialog } from "./kullanicilar/invite-user-dialog";
import { EditUserDialog } from "./kullanicilar/edit-user-dialog";

export default async function YonetimPage() {
  await requireRole("admin");
  const supabase = await createClient();

  const [companies, tags, { data: users }] = await Promise.all([
    listCompaniesWithTags(),
    listTags(),
    supabase.from("profiles").select("*").order("created_at", { ascending: false }),
  ]);

  const typedUsers = (users ?? []) as Profile[];
  const companiesForSelect: Pick<Company, "id" | "name">[] = companies.map((c) => ({ id: c.id, name: c.name }));
  const companyMap = new Map(companiesForSelect.map((c) => [c.id, c.name]));

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Yönetim</h1>
        <p className="text-sm text-muted-foreground">Firmalar, etiketler ve kullanıcıları buradan yönetin.</p>
      </div>

      <Tabs defaultValue="firmalar">
        <TabsList>
          <TabsTrigger value="firmalar">Firmalar</TabsTrigger>
          <TabsTrigger value="etiketler">Etiketler</TabsTrigger>
          <TabsTrigger value="kullanicilar">Kullanıcılar</TabsTrigger>
        </TabsList>

        <TabsContent value="firmalar" className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              Anlaşmalı firmalar, etiketleri (iş kolu) ve hakediş form şablonları.
            </p>
            <CompanyCreateDialog />
          </div>
          <Card>
            <CardContent className="pt-5">
              {companies.length === 0 ? (
                <p className="text-sm text-muted-foreground">Henüz firma eklenmedi.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Firma</TableHead>
                        <TableHead>Etiketler</TableHead>
                        <TableHead>Sözleşme Bedeli</TableHead>
                        <TableHead>Durum</TableHead>
                        <TableHead />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {companies.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell className="font-medium">
                            {c.name}
                            {c.short_code && (
                              <span className="ml-1 text-xs text-muted-foreground">({c.short_code})</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {c.company_tags.map(({ tags: tag }) => (
                                <Badge key={tag.id} style={{ backgroundColor: tag.color }} className="text-white">
                                  {tag.name}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>{formatPara(c.contract_amount)}</TableCell>
                          <TableCell>
                            <Badge variant={c.is_active ? "success" : "secondary"}>
                              {c.is_active ? "Aktif" : "Pasif"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Link href={`/admin/firmalar/${c.id}`} className="text-sm text-primary hover:underline">
                              Yönet
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
        </TabsContent>

        <TabsContent value="etiketler">
          <Card>
            <CardHeader>
              <CardTitle>Tüm Etiketler</CardTitle>
            </CardHeader>
            <CardContent>
              <TagList tags={tags} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="kullanicilar" className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              Firma, mühendis, satın alma ve yönetici hesaplarını yönetin.
            </p>
            <InviteUserDialog companies={companiesForSelect} />
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
                            <EditUserDialog user={u} companies={companiesForSelect} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
