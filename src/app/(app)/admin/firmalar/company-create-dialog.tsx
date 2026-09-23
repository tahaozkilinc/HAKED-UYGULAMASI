"use client";

import { useActionState, useState } from "react";
import { Plus } from "lucide-react";

import { createCompany } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function CompanyCreateDialog() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createCompany, undefined);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" /> Yeni Firma
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Yeni Firma Ekle</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 flex flex-col gap-1.5">
              <Label htmlFor="name">Firma Adı *</Label>
              <Input id="name" name="name" required />
            </div>
            <div className="col-span-2 flex flex-col gap-1.5">
              <Label htmlFor="short_code">Kısa Kod</Label>
              <Input id="short_code" name="short_code" placeholder="VNC-01" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Yetkili kişileri firma oluşturulduktan sonra firma detay sayfasından ekleyebilirsiniz.
          </p>
          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Kaydediliyor…" : "Firmayı Oluştur"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
