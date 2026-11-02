import { Badge } from "@/components/ui/Badge";
import { STATUS_VERIFIKASI } from "@/lib/admin/merchants";
import type { StatusVerifikasi as Status } from "@/lib/admin/types";

export function StatusVerifikasi({ status }: { status: Status }) {
  const s = STATUS_VERIFIKASI[status];
  return <Badge tone={s.tone} icon={s.icon}>{s.label}</Badge>;
}
