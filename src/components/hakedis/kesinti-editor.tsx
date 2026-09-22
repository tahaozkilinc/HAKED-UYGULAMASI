"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import type { KesintiKalemi } from "@/types/database";
import { formatPara } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface KesintiEditorProps {
  name: string;
  defaultValue?: KesintiKalemi[];
}

export function KesintiEditor({ name, defaultValue }: KesintiEditorProps) {
  const [rows, setRows] = useState<KesintiKalemi[]>(defaultValue ?? []);

  const toplam = useMemo(() => rows.reduce((s, r) => s + (Number(r.tutar) || 0), 0), [rows]);

  function update(index: number, patch: Partial<KesintiKalemi>) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  return (
    <div className="flex flex-col gap-2">
      <input type="hidden" name={name} value={JSON.stringify(rows)} />
      {rows.map((row, index) => (
        <div key={index} className="flex items-center gap-2">
          <Input
            placeholder="Kesinti adı (örn. Teminat Kesintisi)"
            value={row.ad}
            onChange={(e) => update(index, { ad: e.target.value })}
            className="flex-1"
          />
          <Input
            type="number"
            step="any"
            placeholder="Tutar"
            value={row.tutar || ""}
            onChange={(e) => update(index, { tutar: Number(e.target.value) })}
            className="w-32"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setRows((prev) => prev.filter((_, i) => i !== index))}
          >
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </div>
      ))}
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-fit"
          onClick={() => setRows((prev) => [...prev, { ad: "", tutar: 0 }])}
        >
          <Plus className="size-4" /> Kesinti Ekle
        </Button>
        {rows.length > 0 && (
          <p className="text-sm text-muted-foreground">
            Toplam Kesinti: <span className="font-medium text-foreground">{formatPara(toplam)}</span>
          </p>
        )}
      </div>
    </div>
  );
}
