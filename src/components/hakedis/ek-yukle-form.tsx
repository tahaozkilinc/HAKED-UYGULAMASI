"use client";

import { useActionState, useEffect, useRef } from "react";
import { Camera, Paperclip } from "lucide-react";
import { toast } from "sonner";

import { ekYukle } from "@/app/(app)/hakedisler/actions";
import { Button } from "@/components/ui/button";

export function EkYukleForm({ id }: { id: string }) {
  const [state, formAction, pending] = useActionState(ekYukle, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state?.success) {
      toast.success("Dosya yüklendi.");
      formRef.current?.reset();
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="id" value={id} />

      {/* accept="image/*" olması, mobil tarayıcılarda "Fotoğraf Çek" ve
          "Galeriden Seç" seçeneklerini birlikte sunan yerel seçiciyi açar. */}
      <input
        ref={photoInputRef}
        type="file"
        name="foto"
        accept="image/*"
        className="hidden"
        onChange={() => formRef.current?.requestSubmit()}
      />
      <input
        ref={fileInputRef}
        type="file"
        name="belge"
        className="hidden"
        onChange={() => formRef.current?.requestSubmit()}
      />

      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() => photoInputRef.current?.click()}
      >
        <Camera className="size-4" /> {pending ? "Yükleniyor…" : "Fotoğraf Çek / Galeriden Seç"}
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        disabled={pending}
        onClick={() => fileInputRef.current?.click()}
      >
        <Paperclip className="size-4" /> Dosya Ekle
      </Button>
    </form>
  );
}
