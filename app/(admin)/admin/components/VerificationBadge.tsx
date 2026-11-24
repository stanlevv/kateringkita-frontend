// Komponen VerificationBadge: lencana status verifikasi penjual (menunggu, perlu perbaikan, terverifikasi,
// ditangguhkan). Label, warna, dan ikon dari VERIFICATION_STATUSES (services/admin-merchant.service.ts).
import { Badge } from "@/app/components/ui/Badge";
import { VERIFICATION_STATUSES } from "@/services/admin-merchant.service";
import type { VerificationStatus } from "@/types/admin";

/**
 * Lencana status verifikasi.
 * @param props.status status verifikasi dari backend
 * @returns Badge
 */
export function VerificationBadge({ status }: { status: VerificationStatus }) {
  const view = VERIFICATION_STATUSES[status];
  return (
    <Badge tone={view.tone} icon={view.icon}>
      {view.label}
    </Badge>
  );
}
