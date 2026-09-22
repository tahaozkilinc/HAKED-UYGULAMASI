"use client";

import { useActionState, useMemo, useState } from "react";

import type { Company, Hakedis, HakedisKalemi } from "@/types/database";
import type { MuhendisOzet } from "@/lib/data/companies";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KalemForm } from "./kalem-form";

type ActionState = { error?: string; success?: boolean } | undefined;
type FormAction = (state: ActionState, formData: FormData) => Promise<ActionState>;

interface HakedisFormProps {
  action: FormAction;
  company: Company;
  /** Sadece admin akışı: firma seçimi değiştiğinde kalem şeması da değişir. */
  companies?: Company[];
  /** Sistemdeki tüm mühendisler; hakediş oluştururken bunlardan biri seçilir. */
  muhendisler: MuhendisOzet[];
  defaultHakedis?: Hakedis;
  defaultKalemler?: HakedisKalemi[];
}

export function HakedisForm({
  action,
  company,
  companies,
  muhendisler,
  defaultHakedis,
  defaultKalemler,
}: HakedisFormProps) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [selectedCompany, setSelectedCompany] = useState(company);

  // Mühendis, hakediş oluşturulurken bir kez seçilir; hakedişi açan firma
  // daha sonra bunu değiştiremez (geriye dönük düzeltme yapılamaz).
  const mevcutMuhendis = useMemo(
    () => muhendisler.find((m) => m.id === defaultHakedis?.muhendis_id),
    [muhendisler, defaultHakedis?.muhendis_id],
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {defaultHakedis && <input type="hidden" name="id" value={defaultHakedis.id} />}

      <Card>
        <CardHeader>
          <CardTitle>Hakediş Bilgileri</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {companies ? (
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="company_id">Firma</Label>
              <Select
                name="company_id"
                defaultValue={company.id}
                onValueChange={(id) => {
                  const found = companies.find((c) => c.id === id);
                  if (found) setSelectedCompany(found);
                }}
              >
                <SelectTrigger id="company_id">
                  <SelectValue placeholder="Firma seçin" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label>Firma</Label>
              <p className="flex h-9 items-center rounded-md border bg-muted px-3 text-sm">{company.name}</p>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="donem_baslangic">Dönem Başlangıcı</Label>
            <Input
              id="donem_baslangic"
              name="donem_baslangic"
              type="date"
              required
              defaultValue={defaultHakedis?.donem_baslangic}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="donem_bitis">Dönem Bitişi</Label>
            <Input
              id="donem_bitis"
              name="donem_bitis"
              type="date"
              required
              defaultValue={defaultHakedis?.donem_bitis}
            />
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="muhendis_id">İlgili Mühendis *</Label>
            {defaultHakedis ? (
              <>
                <p className="flex h-9 items-center rounded-md border bg-muted px-3 text-sm">
                  {mevcutMuhendis?.full_name || mevcutMuhendis?.email || "Mühendis bulunamadı"}
                </p>
                <p className="text-xs text-muted-foreground">
                  İlgili mühendis hakediş oluşturulurken belirlenir, sonradan değiştirilemez.
                </p>
              </>
            ) : (
              <>
                <Select name="muhendis_id" required>
                  <SelectTrigger id="muhendis_id">
                    <SelectValue placeholder="Mühendis seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {muhendisler.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.full_name || m.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {muhendisler.length === 0 && (
                  <p className="text-xs text-destructive">
                    Sistemde mühendis rolünde kullanıcı yok. Önce Yönetim → Kullanıcılar sayfasından bir mühendis
                    ekleyin.
                  </p>
                )}
              </>
            )}
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="aciklama">Açıklama (opsiyonel)</Label>
            <Textarea id="aciklama" name="aciklama" defaultValue={defaultHakedis?.aciklama ?? ""} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Hakediş Kalemleri</CardTitle>
        </CardHeader>
        <CardContent>
          <KalemForm
            key={selectedCompany.id}
            schema={selectedCompany.hakedis_schema}
            name="kalemler"
            defaultItems={selectedCompany.id === company.id ? defaultKalemler : undefined}
          />
        </CardContent>
      </Card>

      {state?.error && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <div className="flex flex-wrap justify-end gap-2">
        <Button type="submit" name="submit_action" value="taslak" variant="outline" disabled={pending}>
          Taslak Olarak Kaydet
        </Button>
        <Button type="submit" name="submit_action" value="gonder" disabled={pending}>
          {pending ? "Gönderiliyor…" : "Mühendis Onayına Gönder"}
        </Button>
      </div>
    </form>
  );
}
