"use client";

import { useActionState, useState } from "react";

import type { Company, Hakedis, HakedisKalemi } from "@/types/database";
import { KDV_VARSAYILAN } from "@/lib/constants";
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
import { KesintiEditor } from "./kesinti-editor";

type ActionState = { error?: string; success?: boolean } | undefined;
type FormAction = (state: ActionState, formData: FormData) => Promise<ActionState>;

interface HakedisFormProps {
  action: FormAction;
  company: Company;
  /** Sadece admin akışı: firma seçimi değiştiğinde kalem şeması da değişir. */
  companies?: Company[];
  defaultHakedis?: Hakedis;
  defaultKalemler?: HakedisKalemi[];
}

export function HakedisForm({ action, company, companies, defaultHakedis, defaultKalemler }: HakedisFormProps) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [selectedCompany, setSelectedCompany] = useState(company);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {defaultHakedis && <input type="hidden" name="id" value={defaultHakedis.id} />}

      <Card>
        <CardHeader>
          <CardTitle>Hakediş Bilgileri</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="kdv_orani">KDV Oranı (%)</Label>
            <Input
              id="kdv_orani"
              name="kdv_orani"
              type="number"
              step="any"
              defaultValue={defaultHakedis?.kdv_orani ?? KDV_VARSAYILAN}
            />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-3">
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

      <Card>
        <CardHeader>
          <CardTitle>Kesintiler</CardTitle>
        </CardHeader>
        <CardContent>
          <KesintiEditor name="kesintiler" defaultValue={defaultHakedis?.kesintiler} />
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
