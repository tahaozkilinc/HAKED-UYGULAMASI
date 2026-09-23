"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";

import type { HakedisSchema, HakedisSchemaField, SchemaFieldType } from "@/types/database";
import { ALAN_TIPI_ETIKETLERI } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function slugify(label: string) {
  return (
    label
      .toLowerCase()
      .replace(/ç/g, "c")
      .replace(/ğ/g, "g")
      .replace(/ı/g, "i")
      .replace(/ö/g, "o")
      .replace(/ş/g, "s")
      .replace(/ü/g, "u")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") || "alan"
  );
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
  const [gelismisAcik, setGelismisAcik] = useState<Record<number, boolean>>({});

  function updateField(index: number, patch: Partial<HakedisSchemaField>) {
    setFields((prev) => prev.map((f, i) => (i === index ? { ...f, ...patch } : f)));
  }

  function labelDegisti(index: number, label: string) {
    setFields((prev) =>
      prev.map((f, i) => {
        if (i !== index) return f;
        // Anahtar elle değiştirilmediyse etikete göre otomatik güncellenmeye devam etsin.
        const otomatikMi = f.key === slugify(f.label);
        const yeniAnahtar = otomatikMi
          ? uniqueKey(
              slugify(label),
              prev.filter((_, j) => j !== index).map((x) => x.key),
            )
          : f.key;
        return { ...f, label, key: yeniAnahtar };
      }),
    );
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
    <div className="flex flex-col gap-4">
      <input type="hidden" name={name} value={JSON.stringify(schema)} />

      <p className="text-sm text-muted-foreground">
        Bu firmanın hakediş kalemlerinde firmanın gireceği sütunları belirleyin (ör. Kalem
        Açıklaması, Birim, Miktar). Sırayı yukarı/aşağı okla değiştirebilir, alanı silebilir
        veya yeni alan ekleyebilirsiniz.
      </p>

      {fields.length === 0 && (
        <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
          Henüz alan tanımlanmadı. Aşağıdaki &quot;Alan Ekle&quot; ile başlayın (örn. Kalem No,
          Açıklama, Birim, Miktar, Birim Fiyat).
        </p>
      )}

      {fields.map((field, index) => {
        const gelismis = !!gelismisAcik[index];
        return (
          <Card key={index} className="border-muted-foreground/20">
            <CardContent className="flex flex-col gap-3 pt-5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {index + 1}
                  </span>
                  <span className="text-sm font-medium">Alan {index + 1}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    aria-label="Yukarı taşı"
                  >
                    <ChevronUp className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => move(index, 1)}
                    disabled={index === fields.length - 1}
                    aria-label="Aşağı taşı"
                  >
                    <ChevronDown className="size-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeField(index)}>
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label>Alan Adı</Label>
                  <Input
                    value={field.label}
                    onChange={(e) => labelDegisti(index, e.target.value)}
                    placeholder="Örn. Birim Fiyat"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label>Alan Tipi</Label>
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

                {field.type === "select" && (
                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <Label>Seçenekler (virgülle ayırın)</Label>
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
                )}

                {field.type === "computed" && (
                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <Label>Formül</Label>
                    <Input
                      value={field.formula ?? ""}
                      onChange={(e) => updateField(index, { formula: e.target.value })}
                      placeholder="miktar * birim_fiyat"
                    />
                    <p className="text-xs text-muted-foreground">
                      Diğer alanların anahtarlarını kullanın (ör. miktar, birim_fiyat).
                    </p>
                  </div>
                )}

                {(field.type === "number" || field.type === "currency") && !gelismis && (
                  <div className="flex flex-col gap-1.5">
                    <Label>Birim (opsiyonel)</Label>
                    <Input
                      value={field.unit ?? ""}
                      onChange={(e) => updateField(index, { unit: e.target.value })}
                      placeholder="m2, kg, saat…"
                    />
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`required-${index}`}
                    checked={!!field.required}
                    onCheckedChange={(checked) => updateField(index, { required: !!checked })}
                  />
                  <Label htmlFor={`required-${index}`} className="text-sm font-normal">
                    Bu alan doldurulması zorunlu olsun
                  </Label>
                </div>
                <button
                  type="button"
                  className="text-xs text-muted-foreground underline-offset-2 hover:underline"
                  onClick={() => setGelismisAcik((prev) => ({ ...prev, [index]: !prev[index] }))}
                >
                  {gelismis ? "Gelişmiş ayarları gizle" : "Gelişmiş ayarlar (alan anahtarı)"}
                </button>
              </div>

              {gelismis && (
                <div className="flex flex-col gap-1.5 rounded-md bg-muted/40 p-3">
                  <Label className="text-xs">Alan Anahtarı (teknik, formüllerde kullanılır)</Label>
                  <Input
                    value={field.key}
                    onChange={(e) => updateField(index, { key: slugify(e.target.value) })}
                    className="font-mono text-xs"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      <Button type="button" variant="outline" onClick={addField} className="w-fit">
        <Plus className="size-4" /> Alan Ekle
      </Button>

      {fields.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">Önizleme — firma hakediş girerken bu sütunları görecek:</p>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  {fields.map((f) => (
                    <TableHead key={f.key}>
                      {f.label || <span className="italic text-muted-foreground">(adsız)</span>}
                      {f.required && <span className="text-destructive"> *</span>}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="text-muted-foreground">1</TableCell>
                  {fields.map((f) => (
                    <TableCell key={f.key} className="text-muted-foreground italic">
                      {f.type === "select" ? f.options?.[0] ?? "seçenek" : ALAN_TIPI_ETIKETLERI[f.type]}
                    </TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
