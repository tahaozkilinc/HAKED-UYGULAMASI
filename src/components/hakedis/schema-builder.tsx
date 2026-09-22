"use client";

import { useState } from "react";
import { GripVertical, Plus, Trash2 } from "lucide-react";

import type { HakedisSchema, HakedisSchemaField, SchemaFieldType } from "@/types/database";
import { ALAN_TIPI_ETIKETLERI } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

function slugify(label: string) {
  return label
    .toLowerCase()
    .replace(/ç/g, "c")
    .replace(/ğ/g, "g")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ş/g, "s")
    .replace(/ü/g, "u")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "") || "alan";
}

function uniqueKey(base: string, existing: string[]) {
  let key = base;
  let i = 2;
  while (existing.includes(key)) {
    key = `${base}_${i}`;
    i++;
  }
  return key;
}

interface SchemaBuilderProps {
  name: string;
  defaultValue: HakedisSchema;
}

export function SchemaBuilder({ name, defaultValue }: SchemaBuilderProps) {
  const [fields, setFields] = useState<HakedisSchemaField[]>(
    defaultValue.fields?.length ? defaultValue.fields : [],
  );

  function updateField(index: number, patch: Partial<HakedisSchemaField>) {
    setFields((prev) => prev.map((f, i) => (i === index ? { ...f, ...patch } : f)));
  }

  function addField() {
    const label = `Yeni Alan ${fields.length + 1}`;
    const key = uniqueKey(slugify(label), fields.map((f) => f.key));
    setFields((prev) => [...prev, { key, label, type: "text", required: false }]);
  }

  function removeField(index: number) {
    setFields((prev) => prev.filter((_, i) => i !== index));
  }

  function move(index: number, dir: -1 | 1) {
    setFields((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  const schema: HakedisSchema = { fields };

  return (
    <div className="flex flex-col gap-3">
      <input type="hidden" name={name} value={JSON.stringify(schema)} />

      {fields.length === 0 && (
        <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
          Henüz alan tanımlanmadı. Bu firmanın hakediş kalemlerinde hangi bilgilerin
          girileceğini belirlemek için &quot;Alan Ekle&quot; ile başlayın (örn. Kalem No,
          Açıklama, Birim, Miktar, Birim Fiyat).
        </p>
      )}

      {fields.map((field, index) => (
        <Card key={index} className="border-muted-foreground/20">
          <CardContent className="grid grid-cols-1 gap-3 pt-5 sm:grid-cols-12 sm:items-end">
            <div className="flex items-center gap-1 sm:col-span-1 sm:justify-center">
              <div className="flex flex-col text-muted-foreground">
                <button type="button" onClick={() => move(index, -1)} className="hover:text-foreground" aria-label="Yukarı taşı">
                  ▲
                </button>
                <GripVertical className="size-4" />
                <button type="button" onClick={() => move(index, 1)} className="hover:text-foreground" aria-label="Aşağı taşı">
                  ▼
                </button>
              </div>
            </div>

            <div className="sm:col-span-3">
              <Label className="mb-1">Etiket</Label>
              <Input
                value={field.label}
                onChange={(e) => updateField(index, { label: e.target.value })}
                placeholder="Örn. Birim Fiyat"
              />
            </div>

            <div className="sm:col-span-2">
              <Label className="mb-1">Alan Anahtarı</Label>
              <Input
                value={field.key}
                onChange={(e) => updateField(index, { key: slugify(e.target.value) })}
                placeholder="birim_fiyat"
              />
            </div>

            <div className="sm:col-span-2">
              <Label className="mb-1">Tip</Label>
              <Select
                value={field.type}
                onValueChange={(value: SchemaFieldType) => updateField(index, { type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ALAN_TIPI_ETIKETLERI).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {field.type === "select" ? (
              <div className="sm:col-span-2">
                <Label className="mb-1">Seçenekler (virgülle)</Label>
                <Input
                  value={field.options?.join(", ") ?? ""}
                  onChange={(e) =>
                    updateField(index, {
                      options: e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder="m2, m3, kg, adet"
                />
              </div>
            ) : field.type === "computed" ? (
              <div className="sm:col-span-2">
                <Label className="mb-1">Formül</Label>
                <Input
                  value={field.formula ?? ""}
                  onChange={(e) => updateField(index, { formula: e.target.value })}
                  placeholder="miktar * birim_fiyat"
                />
              </div>
            ) : (
              <div className="sm:col-span-2">
                <Label className="mb-1">Birim (opsiyonel)</Label>
                <Input
                  value={field.unit ?? ""}
                  onChange={(e) => updateField(index, { unit: e.target.value })}
                  placeholder="m2, kg, saat…"
                />
              </div>
            )}

            <div className="flex items-center gap-2 sm:col-span-1">
              <Checkbox
                id={`required-${index}`}
                checked={!!field.required}
                onCheckedChange={(checked) => updateField(index, { required: !!checked })}
              />
              <Label htmlFor={`required-${index}`} className="text-xs">
                Zorunlu
              </Label>
            </div>

            <div className="sm:col-span-1 sm:text-right">
              <Button type="button" variant="ghost" size="icon" onClick={() => removeField(index)}>
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      <Button type="button" variant="outline" onClick={addField} className="w-fit">
        <Plus className="size-4" /> Alan Ekle
      </Button>

      <p className="text-xs text-muted-foreground">
        İpucu: &quot;Hesaplanan&quot; tip alanlar, diğer alanların anahtarlarını kullanan
        basit bir formülle (ör. <code>miktar * birim_fiyat</code>) otomatik hesaplanır ve
        satırın tutarı olarak kullanılabilir.
      </p>
    </div>
  );
}
