"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";

import type { Company } from "@/types/database";
import { updateCompanyInfo } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

export function CompanyInfoForm({ company }: { company: Company }) {
  const [state, formAction, pending] = useActionState(updateCompanyInfo, undefined);

  useEffect(() => {
    if (state?.success) toast.success("Firma bilgileri güncellendi.");
  }, [state]);

  return (
    <form action={formAction} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <input type="hidden" name="id" value={company.id} />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Firma Adı *</Label>
        <Input id="name" name="name" required defaultValue={company.name} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="short_code">Kısa Kod</Label>
        <Input id="short_code" name="short_code" defaultValue={company.short_code ?? ""} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="tax_number">Vergi No</Label>
        <Input id="tax_number" name="tax_number" defaultValue={company.tax_number ?? ""} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="contract_amount">Sözleşme Bedeli (₺)</Label>
        <Input
          id="contract_amount"
          name="contract_amount"
          type="number"
          step="any"
          defaultValue={company.contract_amount ?? ""}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="contact_name">Yetkili Kişi</Label>
        <Input id="contact_name" name="contact_name" defaultValue={company.contact_name ?? ""} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="contact_phone">Telefon</Label>
        <Input id="contact_phone" name="contact_phone" defaultValue={company.contact_phone ?? ""} />
      </div>
      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <Label htmlFor="contact_email">E-posta</Label>
        <Input id="contact_email" name="contact_email" type="email" defaultValue={company.contact_email ?? ""} />
      </div>
      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <Label htmlFor="notes">Notlar</Label>
        <Textarea id="notes" name="notes" defaultValue={company.notes ?? ""} />
      </div>
      <div className="flex items-center gap-2 sm:col-span-2">
        <Switch id="is_active" name="is_active" defaultChecked={company.is_active} />
        <Label htmlFor="is_active">Aktif</Label>
      </div>

      {state?.error && <p className="text-sm text-destructive sm:col-span-2">{state.error}</p>}

      <div className="sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Kaydediliyor…" : "Kaydet"}
        </Button>
      </div>
    </form>
  );
}
