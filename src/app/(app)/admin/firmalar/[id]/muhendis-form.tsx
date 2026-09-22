"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";

import type { Profile } from "@/types/database";
import { setMuhendisAssignments } from "../actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export function MuhendisAssignForm({
  companyId,
  muhendisler,
  assignedIds,
}: {
  companyId: string;
  muhendisler: Profile[];
  assignedIds: string[];
}) {
  const [state, formAction, pending] = useActionState(setMuhendisAssignments, undefined);

  useEffect(() => {
    if (state?.success) toast.success("Mühendis atamaları güncellendi.");
  }, [state]);

  if (muhendisler.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Henüz mühendis rolünde kullanıcı yok. Önce &quot;Kullanıcılar&quot; sayfasından mühendis ekleyin.
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="company_id" value={companyId} />
      <div className="flex flex-col gap-2">
        {muhendisler.map((m) => (
          <label key={m.id} className="flex items-center gap-2 text-sm">
            <Checkbox name="muhendis_ids" value={m.id} defaultChecked={assignedIds.includes(m.id)} />
            <Label className="cursor-pointer font-normal">
              {m.full_name || m.email} <span className="text-muted-foreground">({m.email})</span>
            </Label>
          </label>
        ))}
      </div>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Kaydediliyor…" : "Atamaları Kaydet"}
      </Button>
    </form>
  );
}
