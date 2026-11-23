import { Badge } from "@/app/components/ui/Badge";
import { VERIFICATION_STATUSES } from "@/services/admin-merchant.service";
import type { VerificationStatus as Status } from "@/types/admin";

export function VerificationStatus({ status }: { status: Status }) {
  const view = VERIFICATION_STATUSES[status];
  return (
    <Badge tone={view.tone} icon={view.icon}>
      {view.label}
    </Badge>
  );
}
