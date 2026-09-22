"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";

import { yorumEkle } from "@/app/(app)/hakedisler/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function YorumForm({ id }: { id: string }) {
  const [state, formAction, pending] = useActionState(yorumEkle, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      toast.success("Yorum eklendi.");
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="id" value={id} />
      <Textarea name="yorum" placeholder="Bir not veya yorum ekleyin…" required className="min-h-16" />
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" size="sm" variant="outline" className="w-fit" disabled={pending}>
        {pending ? "Ekleniyor…" : "Yorum Ekle"}
      </Button>
    </form>
  );
}
