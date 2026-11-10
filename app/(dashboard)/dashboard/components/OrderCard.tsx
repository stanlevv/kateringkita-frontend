"use client";

import { BellRing, FileText, MapPin, Timer } from "lucide-react";
import { Badge } from "@/app/components/ui/Badge";
import { Button } from "@/app/components/ui/Button";
import { PaymentBadge } from "@/app/components/ui/PaymentBadge";
import { StatusBadge } from "@/app/components/ui/StatusBadge";
import { cx } from "@/app/components/ui/cx";
import { formatJam, formatRupiah, formatTelepon } from "@/lib/format";
import { statusView, tampilanStatus, teksAksi, type AksiPesanan } from "@/lib/order-status";
import type { MerchantOrder } from "@/types/order";
import { ChatWaLink, TombolTolak } from "@/app/components/orders/galatAksi";

const mmss = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

type Props = {
  order: MerchantOrder;
  /** Detik tahan tersisa (holding saja), dihitung induk. */
  sisa: number | null;
  sekarang?: number;
  baru?: boolean;
  /** Aksi yang sedang ditunda/dikirim untuk kartu ini. */
  pending?: AksiPesanan;
  onAksi: (aksi: AksiPesanan) => void;
  onTolak: () => void;
  onSlip: () => void;
};

/** Brief v3 §4. Satu aksi utama per status dari `statusView`. */
export function OrderCard({ order: o, sisa, sekarang, baru, pending, onAksi, onTolak, onSlip }: Props) {
  const v = statusView[tampilanStatus(o)];
  const segera = sisa !== null && sisa < 60;
  const totalTahan = o.hold_until ? Math.max(1, (Date.parse(o.hold_until) - Date.parse(o.created_at)) / 1000) : 300;
  const menitMasak = o.status === "cooking" && o.cooking_at && sekarang ? Math.max(0, Math.floor((sekarang - Date.parse(o.cooking_at)) / 60000)) : null;
  const dibatalkan = o.status === "cancelled" || o.status === "expired";

  return (
    <article
      data-baru={baru ? "true" : undefined}
      aria-label={`Pesanan ${o.code}`}
      className={cx("relative flex flex-col gap-3 overflow-hidden rounded-lg border p-4 pt-5", baru ? "border-accent bg-primary-soft ring-2 ring-accent" : "border-line bg-surface")}
    >
      {sisa !== null && (
        <div role="progressbar" aria-label="Sisa waktu tahan" aria-valuemin={0} aria-valuemax={Math.round(totalTahan)} aria-valuenow={sisa} className="absolute inset-x-0 top-0 h-1 bg-subtle">
          <div
            className={cx("h-full origin-left transition-transform duration-200 motion-reduce:transition-none", segera ? "bg-danger" : "bg-warning")}
            style={{ transform: `scaleX(${Math.min(1, sisa / totalTahan)})` }}
          />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <span data-kode className="font-mono text-sm font-semibold text-ink">{o.code}</span>
        <StatusBadge order={o} />
        {baru && <Badge tone="info" icon={BellRing}>Baru</Badge>}
        <span className="ml-auto flex items-center gap-3 text-sm">
          {sisa !== null && (
            <span data-timer className={cx("inline-flex items-center gap-1 font-mono font-semibold", segera ? "text-danger" : "text-warning")}>
              <Timer aria-hidden className="size-4" />
              <span>{segera ? `Segera · ${mmss(sisa)}` : mmss(sisa)}</span>
            </span>
          )}
          {menitMasak !== null && <span className="text-info">{menitMasak} mnt</span>}
          <span className="font-mono text-ink-muted">{formatJam(o.created_at)}</span>
        </span>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-ink"><span className="font-semibold">{o.customer_name}</span> {o.customer_phone && <span className="text-ink-muted">· {formatTelepon(o.customer_phone)}</span>}</p>
        <PaymentBadge method={o.payment_method} status={o.payment_status} />
      </div>

      <ul className="flex flex-col gap-1 text-ink">
        {o.items.map((i) => (
          <li key={`${i.menu_id}-${i.options.map((x) => x.id).join()}`}>
            <span className="font-mono">{i.qty}×</span> {i.menu_name}
            {i.options.map((x) => <span key={x.id} className="ml-2 text-sm text-ink-muted">+{x.name}</span>)}
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap justify-between gap-2 text-sm text-ink-muted">
        <span className="inline-flex items-center gap-1"><MapPin aria-hidden className="size-4" /><span>{o.table ? `Meja ${o.table.label}` : o.pickup_point?.name}</span></span>
        <span>{o.table ? "Makan di tempat" : o.pickup_at ? `Ambil: ${formatJam(o.pickup_at)}` : "Ambil: secepatnya"}</span>
      </div>
      {o.note && <p className="rounded-md bg-subtle px-3 py-2 text-sm text-ink">“{o.note}”</p>}
      {dibatalkan && o.cancel_reason && <p className="text-sm text-danger">Alasan: {o.cancel_reason}</p>}

      <div className="mt-auto flex flex-col gap-3 border-t border-line pt-3 sm:flex-row sm:items-center">
        <p className="font-semibold text-ink">Total <span className="font-mono">{formatRupiah(o.total)}</span></p>
        <div className="flex flex-wrap gap-2 sm:ml-auto">
          {v.secondary.includes("reject") && <TombolTolak disabled={!!pending} onClick={onTolak} />}
          {v.secondary.includes("chat-wa") && o.customer_phone && <ChatWaLink code={o.code} />}
          <Button variant="ghost" onClick={onSlip}><FileText aria-hidden className="size-4" />Lihat slip</Button>
          {v.hint && <p className="self-center text-sm text-ink-muted">{v.hint}</p>}
          {v.primary && (
            <Button data-aksi-utama className="w-full sm:w-auto" loading={pending === v.primary} loadingText={teksAksi[v.primary].proses}
              disabled={!!pending} onClick={() => onAksi(v.primary!)}>
              {v.primaryLabel}
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
