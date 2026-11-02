"use client";

import { CircleCheck, CircleX, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Stepper } from "@/components/ui/Stepper";
import { stokMenu, type Stok } from "@/lib/dashboard";
import type { Nada } from "@/lib/order-status";
import type { MerchantMenu } from "@/lib/types";

export const BADGE: Record<Stok, { label: string; tone: Nada; icon: typeof CircleX }> = {
  habis: { label: "Habis", tone: "danger", icon: CircleX },
  menipis: { label: "Menipis", tone: "warning", icon: TriangleAlert },
  aman: { label: "Aman", tone: "success", icon: CircleCheck },
};

/** Brief §5: baris kuota; batas bawah = terjual + ditahan (DB-E4). */
export function QuotaRow({ menu: m, onUbah }: { menu: MerchantMenu; onUbah: (quota: number) => void }) {
  const stok = stokMenu(m);
  const b = BADGE[stok];
  return (
    <li id={`kuota-${m.id}`} data-stok={stok} className="flex flex-col gap-2 border-b border-line py-3 last:border-b-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-medium text-ink">{m.name}</p>
        <Badge tone={b.tone} icon={b.icon}>{b.label}</Badge>
      </div>
      <p className="text-sm text-ink-muted">Tersedia {m.available} · Ditahan {m.held_today} · Terjual {m.sold_today}</p>
      <Stepper value={m.quota_today} min={m.sold_today + m.held_today} onChange={onUbah} label={`Kuota ${m.name}`}
        disabledReason="Tidak bisa di bawah porsi yang sudah dipesan" />
      {stok === "habis" && (
        <div className="flex gap-2">
          {[5, 10].map((n) => (
            <Button key={n} variant="secondary" aria-label={`+${n} porsi ${m.name}`} onClick={() => onUbah(m.quota_today + n)}>+{n}</Button>
          ))}
        </div>
      )}
    </li>
  );
}
