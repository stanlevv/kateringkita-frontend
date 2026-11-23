import { orderStatusView } from "@/lib/order-status";
import type { MerchantOrder } from "@/types/order";
import { Badge } from "./Badge";

export function StatusBadge({
  order,
}: {
  order: Pick<MerchantOrder, "status" | "payment_method" | "payment_status"> & Partial<Pick<MerchantOrder, "table">>;
}) {
  const view = orderStatusView(order);
  return (
    <Badge tone={view.tone} icon={view.icon}>
      {view.label}
    </Badge>
  );
}
