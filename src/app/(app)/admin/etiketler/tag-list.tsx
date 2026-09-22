"use client";

import { useActionState, useEffect, useRef } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import type { Tag } from "@/types/database";
import { createTag, deleteTag } from "./actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const RENK_SECENEKLERI = [
  "#f97316", "#0ea5e9", "#eab308", "#6366f1", "#78716c",
  "#06b6d4", "#334155", "#ec4899", "#22c55e", "#ef4444", "#84cc16",
];

function DeleteTagButton({ id }: { id: string }) {
  const [state, formAction, pending] = useActionState(deleteTag, undefined);

  useEffect(() => {
    if (state?.error) toast.error(state.error);
  }, [state]);

  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={id} />
      <Button type="submit" variant="ghost" size="icon" disabled={pending} title="Etiketi Sil">
        <Trash2 className="size-3.5 text-destructive" />
      </Button>
    </form>
  );
}

export function TagList({ tags }: { tags: Tag[] }) {
  const [state, formAction, pending] = useActionState(createTag, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-2">
        {tags.length === 0 && <p className="text-sm text-muted-foreground">Henüz etiket eklenmedi.</p>}
        {tags.map((tag) => (
          <div key={tag.id} className="flex items-center gap-1 rounded-md border pl-1">
            <Badge style={{ backgroundColor: tag.color }} className="text-white">
              {tag.name}
            </Badge>
            <DeleteTagButton id={tag.id} />
          </div>
        ))}
      </div>

      <form ref={formRef} action={formAction} className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">Yeni Etiket Adı</Label>
          <Input id="name" name="name" placeholder="Örn. Cephe Kaplama" required className="w-56" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="color">Renk</Label>
          <select
            id="color"
            name="color"
            defaultValue={RENK_SECENEKLERI[0]}
            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
          >
            {RENK_SECENEKLERI.map((renk) => (
              <option key={renk} value={renk}>
                {renk}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" disabled={pending}>
          <Plus className="size-4" /> {pending ? "Ekleniyor…" : "Etiket Ekle"}
        </Button>
      </form>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
    </div>
  );
}
