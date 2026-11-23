import { Badge } from "@/app/components/ui/Badge";
import { formatTime, formatDate, formatRelativeTime } from "@/lib/format";
import { TICKET_STATUSES } from "@/services/admin-ticket.service";
import type { TicketStatus as Status } from "@/types/admin";

export function StatusTiket({ status }: { status: Status }) {
  // Nilai di luar kontrak tetap tampil apa adanya, bukan merusak halaman.
  const s: (typeof TICKET_STATUSES)[Status] = TICKET_STATUSES[status] ?? {
    label: status,
    tone: "neutral",
    icon: TICKET_STATUSES.closed.icon,
  };
  return (
    <Badge tone={s.tone} icon={s.icon}>
      {s.label}
    </Badge>
  );
}

export const waktuLengkap = (iso: string) => `${formatDate(iso)}, ${formatTime(iso)} WIB`;

/** "5 menit lalu" dengan waktu lengkap di title & dateTime. */
export function WaktuRelatif({ iso, sekarang }: { iso: string; sekarang: number }) {
  return (
    <time dateTime={iso} title={waktuLengkap(iso)}>
      {formatRelativeTime(iso, sekarang)}
    </time>
  );
}
