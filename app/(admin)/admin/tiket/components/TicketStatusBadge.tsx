// Bagian kecil yang dipakai bersama oleh daftar dan detail tiket bantuan: lencana status tiket (Menunggu, Dibalas,
// Ditutup), format waktu lengkap WIB, dan waktu relatif ("5 menit lalu"). Label, warna, dan ikon status berasal dari
// TICKET_STATUSES (services/admin-ticket.service.ts). Dipakai TicketTable dan TicketDetailView.
import { Badge } from "@/app/components/ui/Badge";
import { formatTime, formatDate, formatRelativeTime } from "@/lib/format";
import { TICKET_STATUSES } from "@/services/admin-ticket.service";
import type { TicketStatus } from "@/types/admin";

/**
 * Lencana status tiket.
 * @param props.status status tiket dari backend (open, answered, closed)
 * @returns Badge berlabel status
 */
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

/**
 * Menulis waktu lengkap dalam WIB, mis. "13 Nov 2026, 09.55 WIB".
 * @param iso waktu ISO dari backend
 * @returns teks tanggal dan jam
 */
export const formatFullTime = (iso: string) => `${formatDate(iso)}, ${formatTime(iso)} WIB`;

/**
 * Waktu relatif, mis. "5 menit lalu", dengan waktu lengkap di atribut title (muncul saat kursor diarahkan) dan
 * dateTime (dibaca mesin).
 * @param props.iso waktu ISO yang ditampilkan
 * @param props.now waktu acuan dalam milidetik; dikirim dari server agar teks server dan peramban sama
 * @returns elemen time
 */
export function RelativeTime({ iso, now }: { iso: string; now: number }) {
  return (
    <time dateTime={iso} title={formatFullTime(iso)}>
      {formatRelativeTime(iso, now)}
    </time>
  );
}
