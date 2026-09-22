import Link from "next/link";

import { requireRole } from "@/lib/auth";
import { listCompaniesWithTags } from "@/lib/data/companies";
import { formatPara } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CompanyCreateDialog } from "./company-create-dialog";

export default async function FirmalarPage() {
  await requireRole("admin");
  const companies = await listCompaniesWithTags();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">Firmalar</h1>
          <p className="text-sm text-muted-foreground">
            Anlaşmalı firmalar, etiketleri (iş kolu) ve hakediş form şablonları.
          </p>
        </div>
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
                        {c.short_code && <span className="ml-1 text-xs text-muted-foreground">({c.short_code})</span>}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {c.company_tags.map(({ tags }) => (
                            <Badge key={tags.id} style={{ backgroundColor: tags.color }} className="text-white">
                              {tags.name}
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
    </div>
  );
}
