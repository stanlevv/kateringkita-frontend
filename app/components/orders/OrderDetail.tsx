// Komponen OrderDetail: rincian satu pesanan (pemesan, item, harga, riwayat status), tombol aksi, dan panel chat.
// Dipakai halaman /pesanan/[code] dan laci slip di dashboard (tanpa tombol aksi dan tanpa chat).
// Status pesanan: holding = menunggu konfirmasi/pembayaran, confirmed = dikonfirmasi, cooking = dimasak,
// ready = siap, completed = selesai, cancelled = dibatalkan, expired = kadaluarsa (tidak dikonfirmasi tepat waktu).
// "use client": komponen ini berjalan di peramban (client component) karena memakai state, efek, atau router.
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin } from "lucide-react";
import { orderAction } from "@/app/actions/orders";
import { callAction } from "@/lib/action";
import { Button } from "@/app/components/ui/Button";
import { PaymentBadge } from "@/app/components/ui/PaymentBadge";
import { StatusBadge } from "@/app/components/ui/StatusBadge";
import { toast } from "@/app/components/ui/Toast";
import { cx } from "@/app/components/ui/cx";
import { formatTime, formatRupiah, formatDate, formatPhone, wibDate } from "@/lib/format";
import { orderStatusView, actionTexts, successText, type OrderAction } from "@/lib/order-status";
import type { MerchantOrder } from "@/types/order";
import { ChatWaLink, actionErrorView, OutOfStockDialog, RejectButton } from "./OrderActionParts";
import { OrderChatPanel } from "./OrderChatPanel";
import { RejectDialog } from "./RejectDialog";
import { StatusTimeline } from "./StatusTimeline";

/** Satu baris rincian harga (label kiri, nominal kanan); `bold` untuk baris Total. */
const PriceRow = ({ label, value, bold }: { label: string; value: string; bold?: boolean }) => (
  <div className={cx("flex justify-between gap-3", bold ? "font-semibold text-ink" : "text-ink-muted")}>
    <dt>{label}</dt>
    <dd className="font-mono">{value}</dd>
  </div>
);

/** Bagian rincian dengan judul (Pemesan, Pesanan, Riwayat status). */
const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="flex flex-col gap-3">
    <h2 className="font-semibold text-ink">{title}</h2>
    {children}
  </section>
);

/**
 * Tombol aksi pesanan. Pilihan tombolnya sama dengan OrderCard (dari orderStatusView), tetapi aksi langsung dikirim
 * tanpa jendela Batalkan 5 detik seperti di dashboard.
 */
function OrderActions({ order }: { order: MerchantOrder }) {
  // State: aksi yang sedang dikirim, dialog tolak, dan dialog stok tidak cukup.
  const router = useRouter();
  const [sending, setSending] = useState<OrderAction | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [outOfStockOpen, setOutOfStockOpen] = useState(false);
  const view = orderStatusView(order);

  async function runAction(action: OrderAction, reason?: string) {
    // 1. Kunci tombol lalu kirim aksi ke server.
    setSending(action);
    const result = await callAction(() => orderAction(order.code, action, reason));
    if ("data" in result) {
      // 2. Berhasil: tombol tetap terkunci sampai status pada prop berubah (OrderActions di-key status), jadi kunci
      // tidak terbuka di jeda sebelum data baru tiba.
      toast({ tone: "success", message: `Pesanan ${order.code} ${successText(action, order)}` });
    } else {
      // 3. Gagal: buka kunci, lalu tampilkan galat; hanya CONFLICT yang perlu memuat ulang data.
      setSending(null);
      const errorView = actionErrorView(result.error.code, action, result.error.message);
      if (errorView.kind === "outOfStock") setOutOfStockOpen(true);
      else toast({ tone: errorView.tone, message: errorView.message });
      if (errorView.kind === "outOfStock" || !errorView.reload) return;
    }
    // 4. Muat ulang data server (router.refresh) agar status baru tampil.
    router.refresh();
  }

  if (!view.primary && !view.secondary.some((secondary) => secondary !== "lihat-slip")) return null;
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
      {view.hint && <p className="self-center text-ink-muted">{view.hint}</p>}
      {view.primary && (
        <Button
          loading={sending === view.primary}
          loadingText={actionTexts[view.primary].pending}
          disabled={!!sending}
          onClick={() => void runAction(view.primary!)}
        >
          {view.primaryLabel}
        </Button>
      )}
      {view.secondary.includes("reject") && <RejectButton disabled={!!sending} onClick={() => setRejectOpen(true)} />}
      {view.secondary.includes("chat-wa") && order.customer_phone && <ChatWaLink code={order.code} />}
      <RejectDialog
        order={rejectOpen ? order : null}
        onClose={() => setRejectOpen(false)}
        onConfirm={(reason) => {
          setRejectOpen(false);
          void runAction("reject", reason);
        }}
      />
      <OutOfStockDialog
        code={outOfStockOpen ? order.code : null}
        onClose={() => setOutOfStockOpen(false)}
        onReject={() => {
          setOutOfStockOpen(false);
          setRejectOpen(true);
        }}
        onAddQuota={() => router.push(`/menu?q=${encodeURIComponent(order.items[0]?.menu_name ?? "")}`)}
      />
    </div>
  );
}

/**
 * Rincian satu pesanan. Selalu menampilkan data dari prop; setelah aksi berhasil halaman dimuat ulang sehingga prop
 * berisi status terbaru.
 * @param props.order data pesanan
 * @param props.showActions tampilkan tombol aksi dan panel chat (bawaan true; false untuk laci slip di dashboard
 * karena kartu dashboard sudah punya tombol aksi)
 * @returns elemen `div` berisi rincian
 */
export function OrderDetail({ order, showActions = true }: { order: MerchantOrder; showActions?: boolean }) {
  const orderDay = wibDate(order.created_at);
  return (
    <div className="flex flex-col gap-6 text-sm text-ink">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge order={order} />
        <PaymentBadge method={order.payment_method} status={order.payment_status} />
      </div>

      <Section title="Pemesan">
        <p>
          <span className="font-semibold">{order.customer_name}</span>
          {order.customer_phone && ` · ${formatPhone(order.customer_phone)}`}
        </p>
        <p className="inline-flex items-center gap-1 text-ink-muted">
          <MapPin aria-hidden className="size-4" />
          {order.table ? `Meja ${order.table.label} · makan di tempat` : `Titik ambil: ${order.pickup_point?.name}`}
        </p>
        {!order.table && (
          <p className="text-ink-muted">
            Waktu ambil:{" "}
            {order.pickup_at
              ? `${wibDate(order.pickup_at) === orderDay ? "" : `${formatDate(order.pickup_at)} `}${formatTime(order.pickup_at)}`
              : "Secepatnya"}
          </p>
        )}
        {order.note && <p className="rounded-md bg-subtle px-3 py-2">“{order.note}”</p>}
      </Section>

      <Section title="Pesanan">
        <ul className="flex flex-col gap-2">
          {order.items.map((item) => (
            <li
              key={`${item.menu_id}-${item.options.map((option) => option.id).join()}`}
              className="flex justify-between gap-3"
            >
              <span>
                <span className="font-mono">{item.qty}×</span> {item.menu_name}
                {item.options.map((option) => (
                  <span key={option.id} className="block text-ink-muted">
                    +{option.name} ({formatRupiah(option.extra_price)})
                  </span>
                ))}
              </span>
              <span className="font-mono">{formatRupiah(item.line_total)}</span>
            </li>
          ))}
        </ul>
        <dl className="flex flex-col gap-1 border-t border-line pt-3">
          <PriceRow label="Subtotal" value={formatRupiah(order.subtotal)} />
          {order.discount > 0 && <PriceRow label="Diskon" value={`− ${formatRupiah(order.discount)}`} />}
          <PriceRow label="Biaya layanan" value={formatRupiah(order.service_fee)} />
          <PriceRow label="Total" value={formatRupiah(order.total)} bold />
        </dl>
      </Section>

      <Section title="Riwayat status">
        <StatusTimeline order={order} />
      </Section>

      {showActions && <OrderActions key={order.status} order={order} />}

      {showActions && (
        <Section title="Chat dengan pembeli">
          <OrderChatPanel code={order.code} />
        </Section>
      )}
    </div>
  );
}
