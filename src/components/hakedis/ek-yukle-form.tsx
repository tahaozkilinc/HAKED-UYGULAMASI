"use client";

import { useActionState, useEffect, useRef } from "react";
import { Paperclip } from "lucide-react";
import { toast } from "sonner";

import { ekYukle } from "@/app/(app)/hakedisler/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function EkYukleForm({ id }: { id: string }) {
  const [state, formAction, pending] = useActionState(ekYukle, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      toast.success("Dosya yüklendi.");
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <Input type="file" name="dosya" required className="max-w-xs" />
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" size="sm" variant="outline" disabled={pending}>
        <Paperclip className="size-4" /> {pending ? "Yükleniyor…" : "Dosya Ekle"}
      </Button>
    </form>
  );
}
