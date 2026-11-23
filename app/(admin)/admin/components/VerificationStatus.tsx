import { Badge } from "@/app/components/ui/Badge";
import { VERIFICATION_STATUSES } from "@/services/admin-merchant.service";
import type { VerificationStatus as Status } from "@/types/admin";

export function StatusVerifikasi({ status }: { status: Status }) {
  const s = VERIFICATION_STATUSES[status];
  return (
    <Badge tone={s.tone} icon={s.icon}>
      {s.label}
    </Badge>
  );
}
