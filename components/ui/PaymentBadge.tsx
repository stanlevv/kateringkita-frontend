import { Ban, Banknote, CheckCircle2, Clock, TimerOff, Undo2, type LucideIcon } from "lucide-react";
import type { Nada } from "@/lib/order-status";
import type { PaymentMethod, PaymentStatus } from "@/lib/types";
import { Badge } from "./Badge";

const metode: Record<PaymentMethod, string> = { qris: "QRIS", va: "Virtual Account", cod: "Tunai" };
const status: Record<PaymentStatus, { label: string; tone: Nada; icon: LucideIcon }> = {
  unpaid: { label: "Belum bayar", tone: "warning", icon: Clock },
  paid: { label: "Lunas", tone: "success", icon: CheckCircle2 },
  failed: { label: "Gagal", tone: "danger", icon: Ban },
  expired: { label: "Kadaluarsa", tone: "danger", icon: TimerOff },
  refunded: { label: "Dikembalikan", tone: "neutral", icon: Undo2 },
};

export function PaymentBadge({ method, status: s }: { method: PaymentMethod; status: PaymentStatus }) {
  const v = status[s];
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center gap-1.5 text-sm text-ink-muted">
        <Banknote aria-hidden className="size-4" />
        {metode[method]}
      </span>
      <Badge tone={v.tone} icon={v.icon}>{v.label}</Badge>
    </span>
  );
}
