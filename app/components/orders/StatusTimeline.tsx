// Komponen StatusTimeline: riwayat status pesanan dari cap waktu tiap tahap. Dipakai OrderDetail.
// Komponen server biasa (tanpa "use client"): tidak memakai state, jadi bisa dirender di server maupun di klien.
import { Ban, CheckCircle2, TimerOff } from "lucide-react";
import { cx } from "@/app/components/ui/cx";
import { formatTime, formatDate } from "@/lib/format";
import { readyStepLabel } from "@/lib/order-status";
import type { MerchantOrder } from "@/types/order";

/** Tahap normal pesanan: kolom cap waktu dan labelnya. */
const STEPS: [keyof MerchantOrder, string | null][] = [
  ["created_at", "Dipesan"],
  ["confirmed_at", "Dikonfirmasi"],
  ["cooking_at", "Mulai dimasak"],
  ["ready_at", null], // label dari readyStepLabel: pesanan meja "diantar", pesanan titik temu "diambil"
  ["completed_at", "Selesai"],
];
/** Siapa yang membatalkan pesanan. */
const ACTOR_LABELS = { merchant: "penjual", customer: "pembeli", system: "sistem" } as const;

/**
 * Daftar tahap yang sudah dilalui pesanan, diurutkan seperti alurnya. Pesanan dibatalkan atau kadaluarsa ditutup
 * dengan baris merah berisi pelaku dan alasannya.
 * @param props.order data pesanan
 * @returns elemen `ol`
 */
export function StatusTimeline({ order }: { order: MerchantOrder }) {
  // 1. Ambil tahap yang cap waktunya terisi.
  const steps = STEPS.filter(([field]) => order[field]).map(([field, label]) => ({
    label: label ?? readyStepLabel(order),
    time: order[field] as string,
    detail: null as string | null,
    failed: false,
  }));
  // 2. Dibatalkan/kadaluarsa: tambah baris penutup dengan pelaku dan alasan.
  if (order.status === "cancelled" || order.status === "expired") {
    steps.push({
      label: order.cancelled_by
        ? `Dibatalkan oleh ${ACTOR_LABELS[order.cancelled_by]}`
        : order.status === "expired"
          ? "Kadaluarsa"
          : "Dibatalkan",
      time: order.cancelled_at ?? order.updated_at,
      detail:
        [
          order.status === "expired" && order.cancelled_by ? "Kadaluarsa" : null,
          order.cancel_reason && `Alasan: ${order.cancel_reason}`,
        ]
          .filter(Boolean)
          .join(" · ") || null,
      failed: true,
    });
  }
  return (
    <ol aria-label="Riwayat status" className="flex flex-col gap-3">
      {steps.map((step) => {
        const Icon = !step.failed ? CheckCircle2 : order.status === "expired" ? TimerOff : Ban;
        return (
          <li key={step.label} className="flex gap-3">
            <Icon aria-hidden className={cx("mt-0.5 size-5 shrink-0", step.failed ? "text-danger" : "text-success")} />
            <div className="flex flex-col">
              <span className={cx("font-medium", step.failed ? "text-danger" : "text-ink")}>{step.label}</span>
              <span className="font-mono text-sm text-ink-muted">
                {formatDate(step.time)} {formatTime(step.time)}
              </span>
              {step.detail && <span className="text-sm text-ink">{step.detail}</span>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
