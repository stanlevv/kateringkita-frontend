"use client";

import Image from "next/image";
import { EyeOff, Pencil, UtensilsCrossed } from "lucide-react";
import { Badge } from "@/app/components/ui/Badge";
import { Button } from "@/app/components/ui/Button";
import { LinkButton } from "@/app/components/ui/LinkButton";
import { Stepper } from "@/app/components/ui/Stepper";
import { stokMenu } from "@/lib/dashboard";
import { formatRupiah } from "@/lib/format";
import { marginPersen } from "@/lib/menu-filter";
import type { MerchantMenu } from "@/types/menu";
import { BADGE } from "@/app/components/menu/QuotaRow";

/** MN-N1: kartu menu. Foto memakai `unoptimized` karena host gambar backend belum diketahui (F04). */
export function MenuCard({ menu: m, onKuota, onDelta, onNonaktif, onAktif }: { menu: MerchantMenu; onKuota: (n: number) => void; onDelta?: (d: number) => void; onNonaktif: () => void; onAktif: () => void }) {
  const b = BADGE[stokMenu(m)];
  return (
    <article aria-label={m.name} className="flex flex-col overflow-hidden rounded-lg border border-line bg-surface">
      <div className="relative flex aspect-[16/9] items-center justify-center bg-subtle">
        {m.image_url ? (
          <Image src={m.image_url} alt="" fill unoptimized sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw" className="object-cover" />
        ) : (
          <UtensilsCrossed aria-hidden className="size-10 text-ink-muted" />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="font-semibold text-ink">{m.name}</h2>
            <p className="text-sm text-ink-muted">{m.category.name}</p>
          </div>
          {m.is_active ? <Badge tone={b.tone} icon={b.icon}>{b.label}</Badge> : <Badge tone="neutral" icon={EyeOff}>Nonaktif</Badge>}
        </div>
        <p className="text-ink">
          <span className="font-mono font-semibold">{formatRupiah(m.price)}</span>
          <span className="text-ink-muted"> / {m.unit_label} · Margin {marginPersen(m)}%</span>
        </p>
        <p className="text-sm text-ink-muted">Tersedia {m.available} · Ditahan {m.held_today} · Terjual {m.sold_today}</p>
        <Stepper value={m.quota_today} min={m.sold_today + m.held_today} onChange={onKuota} onDelta={onDelta} label={`Kuota ${m.name}`}
          disabledReason="Tidak bisa di bawah porsi yang sudah dipesan" />
        <div className="mt-auto flex flex-wrap gap-2 pt-1">
          <LinkButton variant="secondary" href={`/menu/${m.id}`}><Pencil aria-hidden className="size-4" />Ubah</LinkButton>
          {m.is_active ? (
            <Button variant="ghost" onClick={onNonaktif}>Nonaktifkan</Button>
          ) : (
            <Button variant="secondary" onClick={onAktif}>Aktifkan lagi</Button>
          )}
        </div>
      </div>
    </article>
  );
}
