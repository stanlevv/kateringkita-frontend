import { Badge } from "@/app/components/ui/Badge";
import { STATUS_VERIFIKASI } from "@/services/adminMerchantService";
import type { StatusVerifikasi as Status } from "@/types/admin";

export function StatusVerifikasi({ status }: { status: Status }) {
  const s = STATUS_VERIFIKASI[status];
  return <Badge tone={s.tone} icon={s.icon}>{s.label}</Badge>;
}
