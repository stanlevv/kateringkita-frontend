import { Badge } from "@/app/components/ui/Badge";
import { formatJam, formatTanggal, waktuRelatif } from "@/lib/format";
import { STATUS_TIKET } from "@/services/adminTiketService";
import type { StatusTiket as Status } from "@/types/admin";

export function StatusTiket({ status }: { status: Status }) {
  // Nilai di luar kontrak tetap tampil apa adanya, bukan merusak halaman.
  const s: (typeof STATUS_TIKET)[Status] = STATUS_TIKET[status] ?? { label: status, tone: "neutral", icon: STATUS_TIKET.closed.icon };
  return <Badge tone={s.tone} icon={s.icon}>{s.label}</Badge>;
}

export const waktuLengkap = (iso: string) => `${formatTanggal(iso)}, ${formatJam(iso)} WIB`;

/** "5 menit lalu" dengan waktu lengkap di title & dateTime. */
export function WaktuRelatif({ iso, sekarang }: { iso: string; sekarang: number }) {
  return <time dateTime={iso} title={waktuLengkap(iso)}>{waktuRelatif(iso, sekarang)}</time>;
}
