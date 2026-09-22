"use client";

import { useActionState, useEffect, useRef } from "react";
import Image from "next/image";
import { Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import { updateCompanyLogo, removeCompanyLogo } from "../actions";
import { Button } from "@/components/ui/button";

export function CompanyLogoForm({ companyId, logoUrl }: { companyId: string; logoUrl: string | null }) {
  const [uploadState, uploadAction, uploadPending] = useActionState(updateCompanyLogo, undefined);
  const [removeState, removeAction, removePending] = useActionState(removeCompanyLogo, undefined);
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (uploadState?.success) toast.success("Logo güncellendi.");
    if (uploadState?.error) toast.error(uploadState.error);
  }, [uploadState]);

  useEffect(() => {
    if (removeState?.success) toast.success("Logo kaldırıldı.");
  }, [removeState]);

  return (
    <div className="flex items-center gap-4">
      <div className="flex size-20 items-center justify-center rounded-md border bg-muted">
        {logoUrl ? (
          <Image src={logoUrl} alt="Firma logosu" width={80} height={80} className="size-full object-contain p-1" />
        ) : (
          <span className="text-xs text-muted-foreground">Logo yok</span>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <form ref={formRef} action={uploadAction} className="flex items-center gap-2">
          <input type="hidden" name="id" value={companyId} />
          <input
            ref={inputRef}
            type="file"
            name="logo"
            accept="image/*"
            className="hidden"
            onChange={() => formRef.current?.requestSubmit()}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploadPending}
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="size-4" /> {uploadPending ? "Yükleniyor…" : "Logo Yükle"}
          </Button>
        </form>

        {logoUrl && (
          <form action={removeAction}>
            <input type="hidden" name="id" value={companyId} />
            <Button type="submit" variant="ghost" size="sm" disabled={removePending} className="text-destructive">
              <Trash2 className="size-4" /> Logoyu Kaldır
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
