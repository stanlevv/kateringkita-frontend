// Komponen StatusBadge: badge status pesanan (mis. "Menunggu konfirmasi"). Dipakai OrderCard, OrderTable, OrderDetail.
import { orderStatusView } from "@/lib/order-status";
import type { MerchantOrder } from "@/types/order";
import { Badge } from "./Badge";

/**
 * Badge status pesanan. Label, nada, dan ikonnya diambil dari peta status di lib/order-status.ts.
 * @param props.order status, metode bayar, status bayar, dan (opsional) meja pesanan
 * @returns Badge status
 */
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
