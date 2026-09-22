"use client";

import { useActionState, useState } from "react";
import { Copy, UserPlus } from "lucide-react";
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
          <DialogTitle>Yeni Kullanıcı Davet Et</DialogTitle>
          <DialogDescription>
            Kullanıcı oluşturulduğunda geçici bir şifre üretilir; bunu kullanıcıyla güvenli bir
            şekilde paylaşmanız gerekir.
          </DialogDescription>
        </DialogHeader>

        {state?.success && state.tempPassword ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm">Kullanıcı oluşturuldu. Geçici şifre:</p>
            <div className="flex items-center gap-2 rounded-md border bg-muted p-2">
              <code className="flex-1 text-sm">{state.tempPassword}</code>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => {
                  navigator.clipboard.writeText(state.tempPassword!);
                  toast.success("Kopyalandı.");
                }}
              >
                <Copy className="size-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Kullanıcı ilk girişten sonra şifresini Supabase üzerinden değiştirebilir.
            </p>
            <DialogFooter>
              <Button type="button" onClick={() => setOpen(false)}>
                Kapat
              </Button>
            </DialogFooter>
          </div>
        ) : (
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
        )}
      </DialogContent>
    </Dialog>
  );
}
