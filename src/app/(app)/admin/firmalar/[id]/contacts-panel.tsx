"use client";

import { useActionState, useEffect, useRef } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import type { CompanyContact } from "@/types/database";
import { addCompanyContact, deleteCompanyContact, updateCompanyContact } from "../actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function ContactRow({ companyId, contact }: { companyId: string; contact: CompanyContact }) {
  const [state, formAction, pending] = useActionState(updateCompanyContact, undefined);
  const [deleteState, deleteAction, deletePending] = useActionState(deleteCompanyContact, undefined);

  useEffect(() => {
    if (state?.success) toast.success("Yetkili kişi güncellendi.");
    if (state?.error) toast.error(state.error);
  }, [state]);

  useEffect(() => {
    if (deleteState?.error) toast.error(deleteState.error);
  }, [deleteState]);

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 pt-5">
        <form action={formAction} className="flex flex-col gap-3">
          <input type="hidden" name="id" value={contact.id} />
          <input type="hidden" name="company_id" value={companyId} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label>Ad Soyad *</Label>
              <Input name="full_name" required defaultValue={contact.full_name} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Ünvan</Label>
              <Input name="title" placeholder="Örn. Proje Müdürü" defaultValue={contact.title ?? ""} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Telefon</Label>
              <Input name="phone" defaultValue={contact.phone ?? ""} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>E-posta</Label>
              <Input name="email" type="email" defaultValue={contact.email ?? ""} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button type="submit" size="sm" disabled={pending}>
              {pending ? "Kaydediliyor…" : "Kaydet"}
            </Button>
          </div>
        </form>
        <form action={deleteAction} className="w-fit">
          <input type="hidden" name="id" value={contact.id} />
          <input type="hidden" name="company_id" value={companyId} />
          <Button type="submit" variant="ghost" size="sm" disabled={deletePending} className="text-destructive">
            <Trash2 className="size-4" /> Yetkili Kişiyi Sil
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function AddContactForm({ companyId }: { companyId: string }) {
  const [state, formAction, pending] = useActionState(addCompanyContact, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      toast.success("Yetkili kişi eklendi.");
      formRef.current?.reset();
    }
    if (state?.error) toast.error(state.error);
  }, [state]);

  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col gap-3 pt-5">
        <p className="text-sm font-medium">Yeni Yetkili Kişi Ekle</p>
        <form ref={formRef} action={formAction} className="flex flex-col gap-3">
          <input type="hidden" name="company_id" value={companyId} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-full-name">Ad Soyad *</Label>
              <Input id="new-full-name" name="full_name" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-title">Ünvan</Label>
              <Input id="new-title" name="title" placeholder="Örn. Şantiye Şefi" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-phone">Telefon</Label>
              <Input id="new-phone" name="phone" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-email">E-posta</Label>
              <Input id="new-email" name="email" type="email" />
            </div>
          </div>
          <Button type="submit" disabled={pending} className="w-fit">
            <Plus className="size-4" /> {pending ? "Ekleniyor…" : "Yetkili Kişi Ekle"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export function ContactsPanel({ companyId, contacts }: { companyId: string; contacts: CompanyContact[] }) {
  return (
    <div className="flex flex-col gap-3">
      {contacts.length === 0 && (
        <p className="text-sm text-muted-foreground">Henüz yetkili kişi eklenmedi.</p>
      )}
      {contacts.map((contact) => (
        <ContactRow key={contact.id} companyId={companyId} contact={contact} />
      ))}
      <AddContactForm companyId={companyId} />
    </div>
  );
}
