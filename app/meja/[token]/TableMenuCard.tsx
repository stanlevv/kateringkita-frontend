// Kartu menu pada halaman pesan dari meja: tombol jumlah, foto bulat, dan kartu satu menu. Dipakai TableMenuApp.tsx
// dan OptionPicker.tsx.
"use client";

import Image from "next/image";
import { Minus, Plus, UtensilsCrossed } from "lucide-react";
import { cx, focusRing } from "@/app/components/ui/cx";
import { formatRupiah } from "@/lib/format";
import type { TableMenuItem } from "@/types/table";

/**
 * Tombol kurang/tambah jumlah dengan angka di tengah.
 * @param props.value jumlah sekarang
 * @param props.onChange dipanggil dengan jumlah baru (value - 1 atau value + 1)
 * @param props.label nama menu, untuk label pembaca layar ("Kurangi Nasi Ayam")
 * @param props.min batas bawah; tombol kurang mati di batas ini (bawaan 0)
 * @returns grup dua tombol dan angka
 */
export function QuantityStepper({
  value,
  onChange,
  label,
  min = 0,
}: {
  value: number;
  onChange: (value: number) => void;
  label: string;
  min?: number;
}) {
  const buttonClass = cx(
    "flex size-10 items-center justify-center rounded-full border border-line-strong bg-surface text-ink hover:bg-subtle",
    focusRing,
  );
  return (
    <div className="inline-flex items-center gap-3" role="group" aria-label={`Jumlah ${label}`}>
      <button
        type="button"
        className={buttonClass}
        aria-label={`Kurangi ${label}`}
        onClick={() => onChange(value - 1)}
        disabled={value <= min}
      >
        <Minus aria-hidden className="size-4" />
      </button>
      <span className="w-6 text-center font-mono text-lg font-bold" aria-live="polite">
        {value}
      </span>
      <button type="button" className={buttonClass} aria-label={`Tambah ${label}`} onClick={() => onChange(value + 1)}>
        <Plus aria-hidden className="size-4" />
      </button>
    </div>
  );
}

/**
 * Foto menu bulat dengan lencana jumlah di keranjang dan cap "Habis" bila stok habis.
 * @param props.menu menu yang ditampilkan
 * @param props.qty jumlah porsi menu ini di keranjang (lencana tampil bila > 0)
 * @returns foto menu, atau ikon piring bila tidak ada foto
 */
function MenuPhoto({ menu, qty }: { menu: TableMenuItem; qty: number }) {
  const soldOut = menu.badge === "sold_out";
  return (
    <div className="relative size-24 shrink-0">
      <div className="relative size-24 overflow-hidden rounded-full bg-primary-soft shadow-md ring-4 ring-surface">
        {menu.image_url ? (
          <Image
            src={menu.image_url}
            alt=""
            fill
            unoptimized
            sizes="96px"
            className={cx("object-cover", soldOut && "grayscale")}
          />
        ) : (
          <span className="flex size-full items-center justify-center">
            <UtensilsCrossed aria-hidden className="size-8 text-primary" />
          </span>
        )}
      </div>
      {qty > 0 && (
        <span className="absolute -right-1 -top-1 flex h-7 min-w-7 items-center justify-center rounded-full bg-steel px-1.5 font-mono text-sm font-bold text-on-steel">
          {qty}×
        </span>
      )}
      {soldOut && (
        <span className="absolute inset-x-[-4px] top-1/2 -translate-y-1/2 -rotate-12 rounded border-2 border-danger bg-surface/90 py-0.5 text-center text-xs font-black uppercase tracking-[0.2em] text-danger">
          Habis
        </span>
      )}
    </div>
  );
}

/**
 * Kartu satu menu: foto, nama, deskripsi, harga, sisa stok bila menipis, minimal pesan, dan tombol tambah.
 * @param props.menu menu yang ditampilkan
 * @param props.qty jumlah porsi menu ini di keranjang (kartu diberi garis aksen bila > 0)
 * @param props.storeOpen apakah toko sedang buka; bila tutup, tombol tambah mati
 * @param props.onAdd dipanggil saat tombol tambah ditekan
 * @returns elemen `<li>` kartu menu
 */
export function TableMenuCard({
  menu,
  qty,
  storeOpen,
  onAdd,
}: {
  menu: TableMenuItem;
  qty: number;
  storeOpen: boolean;
  onAdd: () => void;
}) {
  const soldOut = menu.badge === "sold_out";
  return (
    <li
      className={cx(
        "flex gap-4 rounded-2xl border bg-surface p-3 shadow-sm transition-colors",
        qty > 0 ? "border-accent" : "border-line",
      )}
    >
      <MenuPhoto menu={menu} qty={qty} />
      <div className="flex min-w-0 flex-1 flex-col">
        <h3 className="font-semibold leading-snug text-ink">{menu.name}</h3>
        {menu.description && <p className="mt-0.5 line-clamp-2 text-sm text-ink-muted">{menu.description}</p>}
        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <div>
            <p className="font-mono font-bold text-ink">
              {formatRupiah(menu.price)}
              <span className="text-xs font-normal text-ink-muted"> /{menu.unit_label}</span>
            </p>
            {menu.badge === "low_stock" && (
              <p className="text-xs font-medium text-warning">
                Sisa {menu.available} {menu.unit_label}
              </p>
            )}
            {menu.min_order_qty > 1 && (
              <p className="text-xs text-ink-muted">
                Min. {menu.min_order_qty} {menu.unit_label}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onAdd}
            disabled={soldOut || !storeOpen}
            aria-label={`Tambah ${menu.name}`}
            className={cx(
              "flex size-11 shrink-0 items-center justify-center rounded-full bg-accent text-ink shadow hover:bg-accent-pressed disabled:bg-line disabled:text-ink-muted disabled:shadow-none",
              focusRing,
            )}
          >
            <Plus aria-hidden className="size-5" />
          </button>
        </div>
      </div>
    </li>
  );
}
