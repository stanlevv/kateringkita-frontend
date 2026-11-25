// Panel pilih opsi tambahan dan jumlah sebelum menu masuk keranjang. Dipakai TableMenuApp.tsx.
"use client";

import { useState } from "react";
import { Button } from "@/app/components/ui/Button";
import { cx, focusRing } from "@/app/components/ui/cx";
import { formatRupiah } from "@/lib/format";
import { unitPrice } from "@/lib/table-cart";
import type { MenuOption } from "@/types/menu";
import type { TableMenuItem } from "@/types/table";
import { QuantityStepper } from "./TableMenuCard";

/**
 * Isi panel pilih opsi tambahan (mis. "Less sugar") dan jumlah sebelum menu masuk keranjang.
 * @param props.menu menu yang punya opsi
 * @param props.onAdd dipanggil dengan opsi terpilih dan jumlah saat tombol "Tambah ke pesanan" ditekan
 * @returns daftar opsi, stepper jumlah, dan tombol tambah berisi harga total
 */
export function OptionPicker({
  menu,
  onAdd,
}: {
  menu: TableMenuItem;
  onAdd: (options: MenuOption[], qty: number) => void;
}) {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [qty, setQty] = useState(menu.min_order_qty);
  const selectedOptions = menu.options.filter((option) => selectedIds.includes(option.id));
  return (
    <div className="flex flex-col gap-5">
      {menu.description && <p className="text-ink-muted">{menu.description}</p>}
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium text-ink">Tambahan (opsional)</legend>
        {menu.options.map((option) => {
          const selected = selectedIds.includes(option.id);
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={selected}
              onClick={() =>
                setSelectedIds((ids) => (selected ? ids.filter((id) => id !== option.id) : [...ids, option.id]))
              }
              className={cx(
                "flex min-h-12 items-center justify-between rounded-xl border px-4 text-left",
                selected ? "border-accent bg-primary-soft font-semibold" : "border-line bg-surface",
                focusRing,
              )}
            >
              <span>{option.name}</span>
              <span className="font-mono text-sm">
                {option.extra_price ? `+${formatRupiah(option.extra_price)}` : "Gratis"}
              </span>
            </button>
          );
        })}
      </fieldset>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Jumlah</span>
        <QuantityStepper
          value={qty}
          min={menu.min_order_qty}
          label={menu.name}
          onChange={(value) => setQty(Math.max(menu.min_order_qty, value))}
        />
      </div>
      <Button size="lg" className="w-full" onClick={() => onAdd(selectedOptions, qty)}>
        Tambah ke pesanan · {formatRupiah(unitPrice({ menu, options: selectedOptions }) * qty)}
      </Button>
    </div>
  );
}
