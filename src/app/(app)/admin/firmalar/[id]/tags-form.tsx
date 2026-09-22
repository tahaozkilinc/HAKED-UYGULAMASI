"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";

import type { Tag } from "@/types/database";
import { setCompanyTags } from "../actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export function CompanyTagsForm({
  companyId,
  allTags,
  selectedTagIds,
}: {
  companyId: string;
  allTags: Tag[];
  selectedTagIds: string[];
}) {
  const [state, formAction, pending] = useActionState(setCompanyTags, undefined);

  useEffect(() => {
    if (state?.success) toast.success("Etiketler güncellendi.");
  }, [state]);

  if (allTags.length === 0) {
    return <p className="text-sm text-muted-foreground">Henüz etiket tanımlanmadı. Önce &quot;Etiketler&quot; sayfasından etiket ekleyin.</p>;
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={companyId} />
      <div className="flex flex-wrap gap-3">
        {allTags.map((tag) => (
          <label
            key={tag.id}
            className="flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm has-[[data-state=checked]]:border-primary"
          >
            <Checkbox name="tag_ids" value={tag.id} defaultChecked={selectedTagIds.includes(tag.id)} />
            <Label className="cursor-pointer">
              <span className="mr-1.5 inline-block size-2 rounded-full" style={{ backgroundColor: tag.color }} />
              {tag.name}
            </Label>
          </label>
        ))}
      </div>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Kaydediliyor…" : "Etiketleri Kaydet"}
      </Button>
    </form>
  );
}
