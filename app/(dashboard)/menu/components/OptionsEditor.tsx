"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/app/components/ui/Button";
import { Field } from "@/app/components/ui/Field";
import { IconButton } from "@/app/components/ui/IconButton";
import { Input } from "@/app/components/ui/Input";

export type BarisOpsi = { k: number; name: string; extra_price: string; t: boolean };

/** MF bagian 6: tambah/hapus/urutkan lewat tombol (tanpa seret). */
export function OptionsEditor({ rows, errors, semua, onChange }: { rows: BarisOpsi[]; errors: Record<string, string>; semua: boolean; onChange: (rows: BarisOpsi[]) => void }) {
  const ubah = (i: number, p: Partial<BarisOpsi>) => onChange(rows.map((r, j) => (j === i ? { ...r, ...p } : r)));
  const geser = (i: number, d: number) => {
    const n = [...rows];
    [n[i], n[i + d]] = [n[i + d], n[i]];
    onChange(n);
  };
  return (
    <div className="flex flex-col gap-3">
      {rows.length === 0 && <p className="text-sm text-ink-muted">Belum ada opsi. Contoh: Sambal pisah, Tambah telur.</p>}
      <ul className="flex flex-col gap-3">
        {rows.map((r, i) => (
          <li key={r.k} aria-label={`Opsi ${i + 1}`} className="flex flex-wrap items-start gap-2">
            <div className="min-w-40 flex-1">
              <Field label={`Nama opsi ${i + 1}`} id={`mf-options-${i}-name`} error={r.t || semua ? errors[`options.${i}.name`] : undefined}>
                <Input value={r.name} maxLength={60} onChange={(e) => ubah(i, { name: e.target.value })} onBlur={() => ubah(i, { t: true })} />
              </Field>
            </div>
            <div className="w-36">
              <Field label="Tambahan harga (Rp)" id={`mf-options-${i}-extra_price`} error={r.t || semua ? errors[`options.${i}.extra_price`] : undefined}>
                <Input type="number" inputMode="numeric" min={0} step={1} value={r.extra_price} onChange={(e) => ubah(i, { extra_price: e.target.value })} onBlur={() => ubah(i, { t: true })} />
              </Field>
            </div>
            <div className="flex items-center gap-1 pt-7">
              <IconButton icon={ArrowUp} label={`Naikkan opsi ${i + 1}`} disabled={i === 0} onClick={() => geser(i, -1)} />
              <IconButton icon={ArrowDown} label={`Turunkan opsi ${i + 1}`} disabled={i === rows.length - 1} onClick={() => geser(i, 1)} />
              <IconButton icon={Trash2} label={`Hapus opsi ${i + 1}`} onClick={() => onChange(rows.filter((_, j) => j !== i))} />
            </div>
          </li>
        ))}
      </ul>
      <div>
        <Button variant="secondary" onClick={() => onChange([...rows, { k: Math.max(0, ...rows.map((r) => r.k)) + 1, name: "", extra_price: "0", t: false }])}>
          <Plus aria-hidden className="size-4" />Tambah opsi
        </Button>
      </div>
    </div>
  );
}
