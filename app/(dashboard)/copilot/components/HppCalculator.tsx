// Komponen HppCalculator: kalkulator HPP di /copilot. Penjual mengisi bahan (biaya beli dan jumlah porsi yang
// dihasilkan) dan target margin; hasil HPP per porsi dan saran harga jual dihitung langsung di peramban
// (lib/hpp.ts). HPP = harga pokok penjualan (modal bahan per porsi); margin = persen laba dari harga jual.
// "use client": komponen ini berjalan di peramban (client component) karena memakai state, efek, atau router.
"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/app/components/ui/Button";
import { Field } from "@/app/components/ui/Field";
import { IconButton } from "@/app/components/ui/IconButton";
import { Input } from "@/app/components/ui/Input";
import { LinkButton } from "@/app/components/ui/LinkButton";
import { formatRupiah } from "@/lib/format";
import { validateHpp, calculateHpp } from "@/lib/hpp";

/** Satu baris bahan di formulir; angka disimpan sebagai teks isian. `id` hanya untuk key React. */
type IngredientRow = { id: number; name: string; cost: string; portions: string };
/** Teks isian menjadi angka; isian kosong menjadi NaN supaya validasi menganggapnya belum diisi. */
const toNumber = (text: string) => (text.trim() === "" ? NaN : Number(text));

/**
 * Kalkulator HPP. Galat per isian baru tampil setelah isian itu ditinggalkan (blur). Tombol "Pakai untuk menu"
 * membuka /menu/baru dengan HPP dan harga terisi lewat parameter URL.
 * @returns grid berisi daftar bahan dan panel hasil
 */
export function HppCalculator() {
  // 1. State baris bahan, margin, id baris berikutnya, dan isian yang sudah disentuh.
  const [rows, setRows] = useState<IngredientRow[]>([{ id: 0, name: "", cost: "", portions: "" }]);
  const [margin, setMargin] = useState("30");
  const [nextId, setNextId] = useState(1);
  const [touched, setTouched] = useState<Set<string>>(new Set());

  // 2. Validasi dan hitung setiap render; hasil hanya ada bila tidak ada galat.
  const ingredients = rows.map((row) => ({
    name: row.name,
    cost: toNumber(row.cost),
    portions: toNumber(row.portions),
  }));
  const errors = validateHpp(ingredients, toNumber(margin));
  const result = Object.keys(errors).length === 0 ? calculateHpp(ingredients, toNumber(margin)) : null;

  // 3. Pengubah baris dan penanda isian yang sudah disentuh.
  const updateRow = (rowId: number, changes: Partial<IngredientRow>) =>
    setRows((previousRows) => previousRows.map((row) => (row.id === rowId ? { ...row, ...changes } : row)));
  const touchHandler = (id: string) => () => setTouched((previousTouched) => new Set(previousTouched).add(id));
  const visibleError = (id: string) => (touched.has(id) ? errors[id] : undefined);

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <section aria-label="Bahan" className="flex flex-col gap-4 rounded-lg border border-line bg-surface p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-ink">Bahan</h2>
        {rows.map((row, i) => (
          <div key={row.id} className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_9rem_7rem_auto] sm:items-start">
            <Field label={`Nama bahan ${i + 1}`} id={`hpp-nama-${row.id}`}>
              <Input value={row.name} onChange={(event) => updateRow(row.id, { name: event.target.value })} />
            </Field>
            <Field label={`Biaya (Rp) bahan ${i + 1}`} id={`hpp-biaya-${row.id}`} error={visibleError(`${i}.biaya`)}>
              <Input
                type="number"
                inputMode="numeric"
                min={1}
                step={1}
                value={row.cost}
                onChange={(event) => updateRow(row.id, { cost: event.target.value })}
                onBlur={touchHandler(`${i}.biaya`)}
              />
            </Field>
            <Field label={`Porsi bahan ${i + 1}`} id={`hpp-porsi-${row.id}`} error={visibleError(`${i}.porsi`)}>
              <Input
                type="number"
                inputMode="numeric"
                min={1}
                step={1}
                value={row.portions}
                onChange={(event) => updateRow(row.id, { portions: event.target.value })}
                onBlur={touchHandler(`${i}.porsi`)}
              />
            </Field>
            {rows.length > 1 && (
              <IconButton
                icon={Trash2}
                label={`Hapus bahan ${i + 1}`}
                onClick={() => setRows((previousRows) => previousRows.filter((item) => item.id !== row.id))}
                className="sm:mt-7"
              />
            )}
          </div>
        ))}
        <div>
          <Button
            variant="secondary"
            onClick={() => {
              setRows((previousRows) => [...previousRows, { id: nextId, name: "", cost: "", portions: "" }]);
              setNextId((previousId) => previousId + 1);
            }}
          >
            <Plus aria-hidden className="size-4" />
            Tambah bahan
          </Button>
        </div>
        <div className="max-w-xs">
          <Field label="Target margin (%)" id="hpp-margin" help="Antara 0 dan 90." error={visibleError("margin")}>
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              max={90}
              step={1}
              value={margin}
              onChange={(event) => setMargin(event.target.value)}
              onBlur={touchHandler("margin")}
            />
          </Field>
        </div>
      </section>

      <aside
        aria-label="Hasil"
        aria-live="polite"
        className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-4 sm:p-6"
      >
        <h2 className="text-lg font-semibold text-ink">Hasil</h2>
        {result ? (
          <>
            <p className="text-ink-muted">HPP per porsi</p>
            <p data-testid="hpp" className="font-mono text-2xl font-bold text-ink">
              {formatRupiah(result.hpp)}
            </p>
            <p className="text-ink-muted">Saran harga jual (dibulatkan ke Rp 500)</p>
            <p data-testid="harga" className="font-mono text-2xl font-bold text-primary">
              {formatRupiah(result.suggested_price)}
            </p>
            <LinkButton href={`/menu/baru?hpp=${result.hpp}&price=${result.suggested_price}`}>
              Pakai untuk menu
            </LinkButton>
          </>
        ) : (
          <p className="text-ink-muted">Lengkapi biaya dan porsi setiap bahan untuk melihat hasil.</p>
        )}
      </aside>
    </div>
  );
}
