"use client";

import { useActionState, useEffect, useState } from "react";
import { Pencil } from "lucide-react";
import { toast } from "sonner";

import type { Company, Profile } from "@/types/database";
import { ROL_ETIKETLERI } from "@/lib/constants";
import { updateUser } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const ROLLER = ["firma", "muhendis", "satin_alma", "admin"] as const;

export function EditUserDialog({ user, companies }: { user: Profile; companies: Pick<Company, "id" | "name">[] }) {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<string>(user.role);
  const [state, formAction, pending] = useActionState(updateUser, undefined);

  useEffect(() => {
    if (state?.success) {
      toast.success("Kullanıcı güncellendi.");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sunucu aksiyonu tamamlandığında dialog'u kapatır, döngü riski yok
      setOpen(false);
    }
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="Düzenle">
          <Pencil className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Kullanıcıyı Düzenle</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-3">
          <input type="hidden" name="id" value={user.id} />
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`full_name-${user.id}`}>Ad Soyad</Label>
            <Input id={`full_name-${user.id}`} name="full_name" defaultValue={user.full_name} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`phone-${user.id}`}>Telefon</Label>
            <Input id={`phone-${user.id}`} name="phone" defaultValue={user.phone ?? ""} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`role-${user.id}`}>Rol</Label>
            <Select name="role" value={role} onValueChange={setRole}>
              <SelectTrigger id={`role-${user.id}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLLER.map((r) => (
                  <SelectItem key={r} value={r}>
                    {ROL_ETIKETLERI[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {role === "firma" && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`company-${user.id}`}>Firma</Label>
              <Select name="company_id" defaultValue={user.company_id ?? undefined}>
                <SelectTrigger id={`company-${user.id}`}>
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
          )}
          <div className="flex items-center gap-2">
            <Switch id={`active-${user.id}`} name="is_active" defaultChecked={user.is_active} />
            <Label htmlFor={`active-${user.id}`}>Aktif (girişe izinli)</Label>
          </div>
          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Kaydediliyor…" : "Kaydet"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
