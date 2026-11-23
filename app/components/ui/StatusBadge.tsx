import { statusViewPesanan } from "@/lib/order-status";
import type { MerchantOrder } from "@/types/order";
import { Badge } from "./Badge";

export function StatusBadge({
  order,
}: {
  order: Pick<MerchantOrder, "status" | "payment_method" | "payment_status"> & Partial<Pick<MerchantOrder, "table">>;
}) {
  const v = statusViewPesanan(order);
  return (
    <Badge tone={v.tone} icon={v.icon}>
      {v.label}
    </Badge>
  );
}
