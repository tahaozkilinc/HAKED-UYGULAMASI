"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";

import type { Profile } from "@/types/database";
import { updateOwnProfile } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ProfileForm({ profile }: { profile: Profile }) {
  const [state, formAction, pending] = useActionState(updateOwnProfile, undefined);

  useEffect(() => {
    if (state?.success) toast.success("Bilgiler güncellendi.");
  }, [state]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="full_name">Ad Soyad</Label>
        <Input id="full_name" name="full_name" defaultValue={profile.full_name} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>E-posta</Label>
        <p className="flex h-9 items-center rounded-md border bg-muted px-3 text-sm text-muted-foreground">
          {profile.email}
        </p>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="phone">Telefon</Label>
        <Input id="phone" name="phone" defaultValue={profile.phone ?? ""} placeholder="05xx xxx xx xx" />
      </div>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Kaydediliyor…" : "Bilgileri Kaydet"}
      </Button>
    </form>
  );
}
