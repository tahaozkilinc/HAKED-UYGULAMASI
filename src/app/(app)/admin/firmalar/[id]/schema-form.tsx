"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";

import type { HakedisSchema } from "@/types/database";
import { updateCompanySchema } from "../actions";
import { Button } from "@/components/ui/button";
import { SchemaBuilder } from "@/components/hakedis/schema-builder";

export function CompanySchemaForm({ companyId, schema }: { companyId: string; schema: HakedisSchema }) {
  const [state, formAction, pending] = useActionState(updateCompanySchema, undefined);

  useEffect(() => {
    if (state?.success) toast.success("Hakediş form şablonu güncellendi.");
  }, [state]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={companyId} />
      <SchemaBuilder name="hakedis_schema" defaultValue={schema} />
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Kaydediliyor…" : "Form Şablonunu Kaydet"}
      </Button>
    </form>
  );
}
