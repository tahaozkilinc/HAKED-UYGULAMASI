"use client";

import { useActionState, useEffect, useState } from "react";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";

import type { Company } from "@/types/database";
import { ROL_ETIKETLERI } from "@/lib/constants";
import { inviteUser } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const ROLLER = ["firma", "muhendis", "satin_alma", "admin"] as const;

export function InviteUserDialog({ companies }: { companies: Pick<Company, "id" | "name">[] }) {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<string>("firma");
  const [state, formAction, pending] = useActionState(inviteUser, undefined);

  useEffect(() => {
    if (state?.success) {
      toast.success("Kullanıcı oluşturuldu.");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sunucu aksiyonu tamamlandığında dialog'u kapatır, döngü riski yok
      setOpen(false);
    }
  }, [state]);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setRole("firma");
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="size-4" /> Yeni Kullanıcı
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Yeni Kullanıcı Oluştur</DialogTitle>
          <DialogDescription>
            Kullanıcı için bir şifre belirleyin ve bunu kendisiyle güvenli bir şekilde paylaşın.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="full_name">Ad Soyad *</Label>
            <Input id="full_name" name="full_name" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">E-posta *</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Şifre *</Label>
            <Input id="password" name="password" type="text" minLength={8} required placeholder="En az 8 karakter" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="phone">Telefon</Label>
            <Input id="phone" name="phone" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="role">Rol *</Label>
            <Select name="role" value={role} onValueChange={setRole}>
              <SelectTrigger id="role">
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
              <Label htmlFor="company_id">Firma *</Label>
              <Select name="company_id">
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
          )}
          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Oluşturuluyor…" : "Kullanıcı Oluştur"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
