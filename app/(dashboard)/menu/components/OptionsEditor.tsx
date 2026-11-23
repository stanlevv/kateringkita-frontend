"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/app/components/ui/Button";
import { Field } from "@/app/components/ui/Field";
import { IconButton } from "@/app/components/ui/IconButton";
import { Input } from "@/app/components/ui/Input";

export type OptionRow = { id: number; name: string; extra_price: string; touched: boolean };

/** MF bagian 6: tambah/hapus/urutkan lewat tombol (tanpa seret). */
export function OptionsEditor({
  rows,
  errors,
  showAllErrors,
  onChange,
}: {
  rows: OptionRow[];
  errors: Record<string, string>;
  showAllErrors: boolean;
  onChange: (rows: OptionRow[]) => void;
}) {
  const updateRow = (i: number, patch: Partial<OptionRow>) =>
    onChange(rows.map((row, j) => (j === i ? { ...row, ...patch } : row)));
  const move = (i: number, direction: number) => {
    const reordered = [...rows];
    [reordered[i], reordered[i + direction]] = [reordered[i + direction], reordered[i]];
    onChange(reordered);
  };
  return (
    <div className="flex flex-col gap-3">
      {rows.length === 0 && (
        <p className="text-sm text-ink-muted">Belum ada opsi. Contoh: Sambal pisah, Tambah telur.</p>
      )}
      <ul className="flex flex-col gap-3">
        {rows.map((row, i) => (
          <li key={row.id} aria-label={`Opsi ${i + 1}`} className="flex flex-wrap items-start gap-2">
            <div className="min-w-40 flex-1">
              <Field
                label={`Nama opsi ${i + 1}`}
                id={`mf-options-${i}-name`}
                error={row.touched || showAllErrors ? errors[`options.${i}.name`] : undefined}
              >
                <Input
                  value={row.name}
                  maxLength={60}
                  onChange={(event) => updateRow(i, { name: event.target.value })}
                  onBlur={() => updateRow(i, { touched: true })}
                />
              </Field>
            </div>
            <div className="w-36">
              <Field
                label="Tambahan harga (Rp)"
                id={`mf-options-${i}-extra_price`}
                error={row.touched || showAllErrors ? errors[`options.${i}.extra_price`] : undefined}
              >
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={1}
                  value={row.extra_price}
                  onChange={(event) => updateRow(i, { extra_price: event.target.value })}
                  onBlur={() => updateRow(i, { touched: true })}
                />
              </Field>
            </div>
            <div className="flex items-center gap-1 pt-7">
              <IconButton
                icon={ArrowUp}
                label={`Naikkan opsi ${i + 1}`}
                disabled={i === 0}
                onClick={() => move(i, -1)}
              />
              <IconButton
                icon={ArrowDown}
                label={`Turunkan opsi ${i + 1}`}
                disabled={i === rows.length - 1}
                onClick={() => move(i, 1)}
              />
              <IconButton
                icon={Trash2}
                label={`Hapus opsi ${i + 1}`}
                onClick={() => onChange(rows.filter((_, j) => j !== i))}
              />
            </div>
          </li>
        ))}
      </ul>
      <div>
        <Button
          variant="secondary"
          onClick={() =>
            onChange([
              ...rows,
              { id: Math.max(0, ...rows.map((row) => row.id)) + 1, name: "", extra_price: "0", touched: false },
            ])
          }
        >
          <Plus aria-hidden className="size-4" />
          Tambah opsi
        </Button>
      </div>
    </div>
  );
}
