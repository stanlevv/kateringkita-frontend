"use client";

import { BellRing, FileText, MapPin, Timer } from "lucide-react";
import { Badge } from "@/app/components/ui/Badge";
import { Button } from "@/app/components/ui/Button";
import { PaymentBadge } from "@/app/components/ui/PaymentBadge";
import { StatusBadge } from "@/app/components/ui/StatusBadge";
import { cx } from "@/app/components/ui/cx";
import { formatTime, formatRupiah, formatPhone } from "@/lib/format";
import { orderStatusView, actionTexts, type OrderAction } from "@/lib/order-status";
import type { MerchantOrder } from "@/types/order";
import { ChatWaLink, RejectButton } from "@/app/components/orders/action-error";

const formatCountdown = (seconds: number) =>
  `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

type Props = {
  order: MerchantOrder;
  /** Detik tahan tersisa (holding saja), dihitung induk. */
  holdSecondsLeft: number | null;
  now?: number;
  isNew?: boolean;
  /** Aksi yang sedang ditunda/dikirim untuk kartu ini. */
  pending?: OrderAction;
  onAction: (action: OrderAction) => void;
  onReject: () => void;
  onSlip: () => void;
};

/** Brief v3 §4. Satu aksi utama per status dari `statusView`. */
export function OrderCard({ order, holdSecondsLeft, now, isNew, pending, onAction, onReject, onSlip }: Props) {
  const view = orderStatusView(order);
  const urgent = holdSecondsLeft !== null && holdSecondsLeft < 60;
  const totalHoldSeconds = order.hold_until
    ? Math.max(1, (Date.parse(order.hold_until) - Date.parse(order.created_at)) / 1000)
    : 300;
  const cookingMinutes =
    order.status === "cooking" && order.cooking_at && now
      ? Math.max(0, Math.floor((now - Date.parse(order.cooking_at)) / 60000))
      : null;
  const cancelled = order.status === "cancelled" || order.status === "expired";

  return (
    <article
      data-baru={isNew ? "true" : undefined}
      aria-label={`Pesanan ${order.code}`}
      className={cx(
        "relative flex flex-col gap-3 overflow-hidden rounded-lg border p-4 pt-5",
        isNew ? "border-accent bg-primary-soft ring-2 ring-accent" : "border-line bg-surface",
      )}
    >
      {holdSecondsLeft !== null && (
        <div
          role="progressbar"
          aria-label="Sisa waktu tahan"
          aria-valuemin={0}
          aria-valuemax={Math.round(totalHoldSeconds)}
          aria-valuenow={holdSecondsLeft}
          className="absolute inset-x-0 top-0 h-1 bg-subtle"
        >
          <div
            className={cx(
              "h-full origin-left transition-transform duration-200 motion-reduce:transition-none",
              urgent ? "bg-danger" : "bg-warning",
            )}
            style={{ transform: `scaleX(${Math.min(1, holdSecondsLeft / totalHoldSeconds)})` }}
          />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <span data-kode className="font-mono text-sm font-semibold text-ink">
          {order.code}
        </span>
        <StatusBadge order={order} />
        {isNew && (
          <Badge tone="info" icon={BellRing}>
            Baru
          </Badge>
        )}
        <span className="ml-auto flex items-center gap-3 text-sm">
          {holdSecondsLeft !== null && (
            <span
              data-timer
              className={cx(
                "inline-flex items-center gap-1 font-mono font-semibold",
                urgent ? "text-danger" : "text-warning",
              )}
            >
              <Timer aria-hidden className="size-4" />
              <span>{urgent ? `Segera · ${formatCountdown(holdSecondsLeft)}` : formatCountdown(holdSecondsLeft)}</span>
            </span>
          )}
          {cookingMinutes !== null && <span className="text-info">{cookingMinutes} mnt</span>}
          <span className="font-mono text-ink-muted">{formatTime(order.created_at)}</span>
        </span>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-ink">
          <span className="font-semibold">{order.customer_name}</span>{" "}
          {order.customer_phone && <span className="text-ink-muted">· {formatPhone(order.customer_phone)}</span>}
        </p>
        <PaymentBadge method={order.payment_method} status={order.payment_status} />
      </div>

      <ul className="flex flex-col gap-1 text-ink">
        {order.items.map((item) => (
          <li key={`${item.menu_id}-${item.options.map((option) => option.id).join()}`}>
            <span className="font-mono">{item.qty}×</span> {item.menu_name}
            {item.options.map((option) => (
              <span key={option.id} className="ml-2 text-sm text-ink-muted">
                +{option.name}
              </span>
            ))}
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap justify-between gap-2 text-sm text-ink-muted">
        <span className="inline-flex items-center gap-1">
          <MapPin aria-hidden className="size-4" />
          <span>{order.table ? `Meja ${order.table.label}` : order.pickup_point?.name}</span>
        </span>
        <span>
          {order.table
            ? "Makan di tempat"
            : order.pickup_at
              ? `Ambil: ${formatTime(order.pickup_at)}`
              : "Ambil: secepatnya"}
        </span>
      </div>
      {order.note && <p className="rounded-md bg-subtle px-3 py-2 text-sm text-ink">“{order.note}”</p>}
      {cancelled && order.cancel_reason && <p className="text-sm text-danger">Alasan: {order.cancel_reason}</p>}

      <div className="mt-auto flex flex-col gap-3 border-t border-line pt-3 sm:flex-row sm:items-center">
        <p className="font-semibold text-ink">
          Total <span className="font-mono">{formatRupiah(order.total)}</span>
        </p>
        <div className="flex flex-wrap gap-2 sm:ml-auto">
          {view.secondary.includes("reject") && <RejectButton disabled={!!pending} onClick={onReject} />}
          {view.secondary.includes("chat-wa") && order.customer_phone && <ChatWaLink code={order.code} />}
          <Button variant="ghost" onClick={onSlip}>
            <FileText aria-hidden className="size-4" />
            Lihat slip
          </Button>
          {view.hint && <p className="self-center text-sm text-ink-muted">{view.hint}</p>}
          {view.primary && (
            <Button
              data-aksi-utama
              className="w-full sm:w-auto"
              loading={pending === view.primary}
              loadingText={actionTexts[view.primary].pending}
              disabled={!!pending}
              onClick={() => onAction(view.primary!)}
            >
              {view.primaryLabel}
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
