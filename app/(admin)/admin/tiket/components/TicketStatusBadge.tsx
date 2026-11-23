import { Badge } from "@/app/components/ui/Badge";
import { formatTime, formatDate, formatRelativeTime } from "@/lib/format";
import { TICKET_STATUSES } from "@/services/admin-ticket.service";
import type { TicketStatus } from "@/types/admin";

export function TicketStatusBadge({ status }: { status: TicketStatus }) {
  // Nilai di luar kontrak tetap tampil apa adanya, bukan merusak halaman.
  const view: (typeof TICKET_STATUSES)[TicketStatus] = TICKET_STATUSES[status] ?? {
    label: status,
    tone: "neutral",
    icon: TICKET_STATUSES.closed.icon,
  };
  return (
    <Badge tone={view.tone} icon={view.icon}>
      {view.label}
    </Badge>
  );
}

export const formatFullTime = (iso: string) => `${formatDate(iso)}, ${formatTime(iso)} WIB`;

/** "5 menit lalu" dengan waktu lengkap di title & dateTime. */
export function RelativeTime({ iso, now }: { iso: string; now: number }) {
  return (
    <time dateTime={iso} title={formatFullTime(iso)}>
      {formatRelativeTime(iso, now)}
    </time>
  );
}
