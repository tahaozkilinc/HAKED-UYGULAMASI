"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import type { HakedisSchema, HakedisKalemi } from "@/types/database";
import { evaluateFormula } from "@/lib/formula";
import { formatPara } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface KalemRow {
  uid: string;
  data: Record<string, string>;
}

function emptyRow(): KalemRow {
  return { uid: crypto.randomUUID(), data: {} };
}

function computeRowTutar(schema: HakedisSchema, row: KalemRow): number {
  const amountKey = schema.amountField ?? schema.fields.find((f) => f.type === "computed")?.key;

  if (amountKey) {
    const field = schema.fields.find((f) => f.key === amountKey);
    if (field?.type === "computed" && field.formula) {
      return evaluateFormula(field.formula, row.data);
    }
    const raw = row.data[amountKey];
    const n = parseFloat(raw ?? "");
    return Number.isFinite(n) ? n : 0;
  }

  const currencyField = schema.fields.find((f) => f.type === "currency");
  if (currencyField) {
    const n = parseFloat(row.data[currencyField.key] ?? "");
    return Number.isFinite(n) ? n : 0;
  }

  return 0;
}

interface KalemFormProps {
  schema: HakedisSchema;
  name: string;
  defaultItems?: HakedisKalemi[];
  readOnly?: boolean;
}

export function KalemForm({ schema, name, defaultItems, readOnly }: KalemFormProps) {
  const [rows, setRows] = useState<KalemRow[]>(() => {
    if (defaultItems?.length) {
      return defaultItems
        .sort((a, b) => a.sira_no - b.sira_no)
        .map((item) => ({
          uid: item.id,
          data: Object.fromEntries(
            Object.entries(item.data).map(([k, v]) => [k, String(v ?? "")]),
          ),
        }));
    }
    return [emptyRow()];
  });

  const payload = useMemo(
    () =>
      rows.map((row, index) => ({
        sira_no: index + 1,
        data: row.data,
        tutar: computeRowTutar(schema, row),
      })),
    [rows, schema],
  );

  function updateCell(uid: string, key: string, value: string) {
    setRows((prev) => prev.map((r) => (r.uid === uid ? { ...r, data: { ...r.data, [key]: value } } : r)));
  }

  function addRow() {
    setRows((prev) => [...prev, emptyRow()]);
  }

  function removeRow(uid: string) {
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.uid !== uid) : prev));
  }

  if (schema.fields.length === 0) {
    return (
      <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
        Bu firma için henüz hakediş kalem şablonu tanımlanmamış. Lütfen yöneticinizden
        &quot;Firmalar&quot; sayfasından bu firmanın hakediş formunu tanımlamasını isteyin.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <input type="hidden" name={name} value={JSON.stringify(payload)} />

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">#</TableHead>
              {schema.fields.map((field) => (
                <TableHead key={field.key}>
                  {field.label}
                  {field.required && <span className="text-destructive"> *</span>}
                  {field.unit && <span className="ml-1 text-muted-foreground">({field.unit})</span>}
                </TableHead>
              ))}
              {!readOnly && <TableHead className="w-10" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow key={row.uid}>
                <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                {schema.fields.map((field) => {
                  const value = row.data[field.key] ?? "";
                  if (field.type === "computed") {
                    const computed = field.formula ? evaluateFormula(field.formula, row.data) : 0;
                    return (
                      <TableCell key={field.key} className="font-medium tabular-nums">
                        {formatPara(computed)}
                      </TableCell>
                    );
                  }
                  if (readOnly) {
                    return (
                      <TableCell key={field.key}>
                        {field.type === "currency" ? formatPara(parseFloat(value) || 0) : value || "-"}
                      </TableCell>
                    );
                  }
                  if (field.type === "select") {
                    return (
                      <TableCell key={field.key} className="min-w-36">
                        <Select
                          value={value}
                          onValueChange={(v) => updateCell(row.uid, field.key, v)}
                          required={field.required}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue placeholder="Seçiniz" />
                          </SelectTrigger>
                          <SelectContent>
                            {(field.options ?? []).map((opt) => (
                              <SelectItem key={opt} value={opt}>
                                {opt}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    );
                  }
                  if (field.type === "textarea") {
                    return (
                      <TableCell key={field.key} className="min-w-48">
                        <Textarea
                          className="min-h-8"
                          value={value}
                          required={field.required}
                          onChange={(e) => updateCell(row.uid, field.key, e.target.value)}
                        />
                      </TableCell>
                    );
                  }
                  return (
                    <TableCell key={field.key} className="min-w-28">
                      <Input
                        className="h-8"
                        type={
                          field.type === "number" || field.type === "currency"
                            ? "number"
                            : field.type === "date"
                              ? "date"
                              : field.type === "time"
                                ? "time"
                                : "text"
                        }
                        step={field.type === "number" || field.type === "currency" ? "any" : undefined}
                        value={value}
                        required={field.required}
                        onChange={(e) => updateCell(row.uid, field.key, e.target.value)}
                      />
                    </TableCell>
                  );
                })}
                {!readOnly && (
                  <TableCell>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeRow(row.uid)}
                      disabled={rows.length === 1}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {!readOnly && (
        <Button type="button" variant="outline" onClick={addRow} className="w-fit">
          <Plus className="size-4" /> Satır Ekle
        </Button>
      )}
    </div>
  );
}
