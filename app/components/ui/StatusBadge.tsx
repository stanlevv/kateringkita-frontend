import { statusView, tampilanStatus } from "@/lib/order-status";
import type { MerchantOrder } from "@/types/order";
import { Badge } from "./Badge";

export function StatusBadge({ order }: { order: Pick<MerchantOrder, "status" | "payment_method" | "payment_status"> }) {
  const v = statusView[tampilanStatus(order)];
  return <Badge tone={v.tone} icon={v.icon}>{v.label}</Badge>;
}
