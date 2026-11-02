import { Ban, CheckCircle2, TimerOff } from "lucide-react";
import { cx } from "@/components/ui/cx";
import { formatJam, formatTanggal } from "@/lib/format";
import type { MerchantOrder } from "@/lib/types";

const TAHAP: [keyof MerchantOrder, string][] = [
  ["created_at", "Dipesan"],
  ["confirmed_at", "Dikonfirmasi"],
  ["cooking_at", "Mulai dimasak"],
  ["ready_at", "Siap diambil"],
  ["completed_at", "Selesai"],
];
const OLEH = { merchant: "penjual", customer: "pembeli", system: "sistem" } as const;

/** PS-N2/PS-A1: tahap yang sudah dilalui dari cap waktu; dibatalkan/kadaluarsa menutup dengan pelaku + alasan. */
export function StatusTimeline({ order: o }: { order: MerchantOrder }) {
  const langkah = TAHAP.filter(([k]) => o[k]).map(([k, label]) => ({ label, waktu: o[k] as string, detail: null as string | null, buruk: false }));
  if (o.status === "cancelled" || o.status === "expired") {
    langkah.push({
      label: o.cancelled_by ? `Dibatalkan oleh ${OLEH[o.cancelled_by]}` : o.status === "expired" ? "Kadaluarsa" : "Dibatalkan",
      waktu: o.cancelled_at ?? o.updated_at,
      detail: [o.status === "expired" && o.cancelled_by ? "Kadaluarsa" : null, o.cancel_reason && `Alasan: ${o.cancel_reason}`].filter(Boolean).join(" · ") || null,
      buruk: true,
    });
  }
  return (
    <ol aria-label="Riwayat status" className="flex flex-col gap-3">
      {langkah.map((l) => {
        const Ikon = !l.buruk ? CheckCircle2 : o.status === "expired" ? TimerOff : Ban;
        return (
          <li key={l.label} className="flex gap-3">
            <Ikon aria-hidden className={cx("mt-0.5 size-5 shrink-0", l.buruk ? "text-danger" : "text-success")} />
            <div className="flex flex-col">
              <span className={cx("font-medium", l.buruk ? "text-danger" : "text-ink")}>{l.label}</span>
              <span className="font-mono text-sm text-ink-muted">{formatTanggal(l.waktu)} {formatJam(l.waktu)}</span>
              {l.detail && <span className="text-sm text-ink">{l.detail}</span>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
