// Komponen OrderCard: kartu satu pesanan di antrean dashboard (timer tahan, item, titik temu, total, tombol aksi,
// dan tombol Chat ke panel chat pesanan).
// Dipakai OrderQueue.
// Status pesanan: holding = menunggu konfirmasi (atau menunggu pembayaran online), confirmed = dikonfirmasi,
// cooking = dimasak, ready = siap diambil/diantar, completed = selesai, cancelled = dibatalkan, expired = kadaluarsa.
// "use client": komponen ini berjalan di peramban (client component) karena memakai state, efek, atau router.
"use client";

import { BellRing, FileText, MapPin, MessagesSquare, Timer } from "lucide-react";
import { Badge } from "@/app/components/ui/Badge";
import { Button } from "@/app/components/ui/Button";
import { LinkButton } from "@/app/components/ui/LinkButton";
import { PaymentBadge } from "@/app/components/ui/PaymentBadge";
import { StatusBadge } from "@/app/components/ui/StatusBadge";
import { cx } from "@/app/components/ui/cx";
import { formatTime, formatRupiah, formatPhone } from "@/lib/format";
import { orderStatusView, actionTexts, type OrderAction } from "@/lib/order-status";
import type { MerchantOrder } from "@/types/order";
import { ChatWaLink, RejectButton } from "@/app/components/orders/OrderActionParts";

/** Detik menjadi "mm:ss". */
const formatCountdown = (seconds: number) =>
  `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

/** Status yang chatnya terbuka (setelah dikonfirmasi sampai siap). */
const CHAT_OPEN_STATUSES: MerchantOrder["status"][] = ["confirmed", "cooking", "ready"];

type Props = {
  order: MerchantOrder;
  /** Detik tahan tersisa (hanya pesanan holding), dihitung komponen induk. */
  holdSecondsLeft: number | null;
  /** Jam server sekarang (ms), untuk lama memasak. */
  now?: number;
  /** Pesanan baru masuk: kartu disorot. */
  isNew?: boolean;
  /** Aksi yang sedang ditunda/dikirim untuk kartu ini. */
  pending?: OrderAction;
  /** Jumlah pesan pembeli belum dibaca di chat pesanan ini. */
  unreadChatCount?: number;
  onAction: (action: OrderAction) => void;
  onReject: () => void;
  onSlip: () => void;
};

/**
 * Kartu pesanan. Tiap status punya paling banyak satu tombol aksi utama (dari orderStatusView), misalnya Konfirmasi
 * untuk pesanan holding. Pesanan holding menampilkan garis dan timer sisa waktu tahan; di bawah 60 detik berwarna merah.
 * @param props.order data pesanan
 * @param props.holdSecondsLeft detik tahan tersisa, atau null
 * @param props.now jam server sekarang (opsional)
 * @param props.isNew sorot sebagai pesanan baru (opsional)
 * @param props.pending aksi yang sedang ditunda/dikirim; semua tombol aksi nonaktif selama ada
 * @param props.unreadChatCount jumlah pesan pembeli belum dibaca (opsional, bawaan 0); tombol Chat tampil bila chat
 *   terbuka atau masih ada pesan belum dibaca
 * @param props.onAction dipanggil dengan aksi utama yang ditekan
 * @param props.onReject membuka dialog tolak
 * @param props.onSlip membuka laci slip
 * @returns elemen `article`
 */
export function OrderCard({
  order,
  holdSecondsLeft,
  now,
  isNew,
  pending,
  unreadChatCount = 0,
  onAction,
  onReject,
  onSlip,
}: Props) {
  // 1. Tombol dan keterangan untuk status ini.
  const view = orderStatusView(order);
  // 2. Timer tahan: segera bila kurang dari 60 detik; panjang total tahan untuk garis kemajuan (bawaan 5 menit).
  const urgent = holdSecondsLeft !== null && holdSecondsLeft < 60;
  const totalHoldSeconds = order.hold_until
    ? Math.max(1, (Date.parse(order.hold_until) - Date.parse(order.created_at)) / 1000)
    : 300;
  // 3. Lama memasak (menit) dan apakah pesanan sudah batal.
  const cookingMinutes =
    order.status === "cooking" && order.cooking_at && now
      ? Math.max(0, Math.floor((now - Date.parse(order.cooking_at)) / 60000))
      : null;
  const cancelled = order.status === "cancelled" || order.status === "expired";
  // 4. Chat: pesanan meja tidak punya chat; pesan belum dibaca tetap bisa dibuka walau chat sudah ditutup.
  const showChat = unreadChatCount > 0 || (!order.table && CHAT_OPEN_STATUSES.includes(order.status));

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
          {showChat && (
            <LinkButton variant="secondary" href={`/pesanan/${encodeURIComponent(order.code)}#chat`}>
              <MessagesSquare aria-hidden className="size-4" />
              {unreadChatCount > 0 ? `Chat · ${unreadChatCount}` : "Chat"}
            </LinkButton>
          )}
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
