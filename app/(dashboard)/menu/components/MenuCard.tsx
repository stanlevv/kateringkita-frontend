"use client";

import Image from "next/image";
import { EyeOff, Pencil, UtensilsCrossed } from "lucide-react";
import { Badge } from "@/app/components/ui/Badge";
import { Button } from "@/app/components/ui/Button";
import { LinkButton } from "@/app/components/ui/LinkButton";
import { Stepper } from "@/app/components/ui/Stepper";
import { menuStockLevel } from "@/lib/dashboard";
import { formatRupiah } from "@/lib/format";
import { marginPercent } from "@/lib/menu-filter";
import type { MerchantMenu } from "@/types/menu";
import { STOCK_BADGES } from "@/app/components/menu/QuotaRow";

/** MN-N1: kartu menu. Foto memakai `unoptimized` karena host gambar backend belum diketahui (F04). */
export function MenuCard({
  menu,
  onQuotaChange,
  onDelta,
  onDeactivate,
  onActivate,
}: {
  menu: MerchantMenu;
  onQuotaChange: (quota: number) => void;
  onDelta?: (delta: number) => void;
  onDeactivate: () => void;
  onActivate: () => void;
}) {
  const badge = STOCK_BADGES[menuStockLevel(menu)];
  return (
    <article aria-label={menu.name} className="flex flex-col overflow-hidden rounded-lg border border-line bg-surface">
      <div className="relative flex aspect-[16/9] items-center justify-center bg-subtle">
        {menu.image_url ? (
          <Image
            src={menu.image_url}
            alt=""
            fill
            unoptimized
            sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
            className="object-cover"
          />
        ) : (
          <UtensilsCrossed aria-hidden className="size-10 text-ink-muted" />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="font-semibold text-ink">{menu.name}</h2>
            <p className="text-sm text-ink-muted">{menu.category.name}</p>
          </div>
          {menu.is_active ? (
            <Badge tone={badge.tone} icon={badge.icon}>
              {badge.label}
            </Badge>
          ) : (
            <Badge tone="neutral" icon={EyeOff}>
              Nonaktif
            </Badge>
          )}
        </div>
        <p className="text-ink">
          <span className="font-mono font-semibold">{formatRupiah(menu.price)}</span>
          <span className="text-ink-muted">
            {" "}
            / {menu.unit_label} · Margin {marginPercent(menu)}%
          </span>
        </p>
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
        <div className="mt-auto flex flex-wrap gap-2 pt-1">
          <LinkButton variant="secondary" href={`/menu/${menu.id}`}>
            <Pencil aria-hidden className="size-4" />
            Ubah
          </LinkButton>
          {menu.is_active ? (
            <Button variant="ghost" onClick={onDeactivate}>
              Nonaktifkan
            </Button>
          ) : (
            <Button variant="secondary" onClick={onActivate}>
              Aktifkan lagi
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
