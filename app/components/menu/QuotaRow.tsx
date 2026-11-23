// Komponen QuotaRow: satu baris kuota menu (nama, badge stok, rincian porsi, stepper kuota, tombol +5/+10).
// Dipakai QuotaPanel di dashboard. Badge stoknya juga dipakai MenuCard di halaman Menu.
// "use client": komponen ini berjalan di peramban (client component) karena memakai state, efek, atau router.
"use client";

import { CircleCheck, CircleX, TriangleAlert } from "lucide-react";
import { Badge } from "@/app/components/ui/Badge";
import { Button } from "@/app/components/ui/Button";
import { Stepper } from "@/app/components/ui/Stepper";
import { menuStockLevel, type StockLevel } from "@/lib/dashboard";
import type { Tone } from "@/lib/order-status";
import type { MerchantMenu } from "@/types/menu";

/** Label, warna, dan ikon badge untuk tiap tingkat stok (habis, menipis, aman). */
export const STOCK_BADGES: Record<StockLevel, { label: string; tone: Tone; icon: typeof CircleX }> = {
  habis: { label: "Habis", tone: "danger", icon: CircleX },
  menipis: { label: "Menipis", tone: "warning", icon: TriangleAlert },
  aman: { label: "Aman", tone: "success", icon: CircleCheck },
};

/**
 * Baris kuota satu menu. Kuota tidak bisa diturunkan di bawah porsi yang sudah terjual ditambah yang sedang ditahan
 * pesanan (ditahan = pesanan yang menunggu konfirmasi). Menu habis mendapat tombol cepat +5 dan +10.
 * @param props.menu data menu
 * @param props.onQuotaChange dipanggil dengan kuota baru (angka mutlak)
 * @param props.onDelta dipanggil dengan selisih (+1, -1, +5, ...); bila ada, tombol memakai ini, bukan onQuotaChange
 * @returns elemen `li`
 */
export function QuotaRow({
  menu,
  onQuotaChange,
  onDelta,
}: {
  menu: MerchantMenu;
  onQuotaChange: (quota: number) => void;
  onDelta?: (delta: number) => void;
}) {
  const stockLevel = menuStockLevel(menu);
  const badge = STOCK_BADGES[stockLevel];
  return (
    <li
      id={`kuota-${menu.id}`}
      data-stok={stockLevel}
      className="flex flex-col gap-2 border-b border-line py-3 last:border-b-0"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-medium text-ink">{menu.name}</p>
        <Badge tone={badge.tone} icon={badge.icon}>
          {badge.label}
        </Badge>
      </div>
      <p className="text-sm text-ink-muted">
        Tersedia {menu.available} · Ditahan {menu.held_today} · Terjual {menu.sold_today}
      </p>
      <Stepper
        value={menu.quota_today}
        min={menu.sold_today + menu.held_today}
        onChange={onQuotaChange}
        onDelta={onDelta}
        label={`Kuota ${menu.name}`}
        disabledReason="Tidak bisa di bawah porsi yang sudah dipesan"
      />
      {stockLevel === "habis" && (
        <div className="flex gap-2">
          {[5, 10].map((amount) => (
            <Button
              key={amount}
              variant="secondary"
              aria-label={`+${amount} porsi ${menu.name}`}
              onClick={() => (onDelta ? onDelta(amount) : onQuotaChange(menu.quota_today + amount))}
            >
              +{amount}
            </Button>
          ))}
        </div>
      )}
    </li>
  );
}
