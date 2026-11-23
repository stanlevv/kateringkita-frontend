"use client";

import { Drawer } from "@/app/components/ui/Drawer";
import type { MerchantOrder } from "@/types/order";
import { OrderDetail } from "@/app/components/orders/OrderDetail";

// DB-N5. Hanya baca: kartu dashboard sudah punya aksi.
export function OrderSlipDrawer({ order, onClose }: { order: MerchantOrder | null; onClose: () => void }) {
  return (
    <Drawer open={!!order} onClose={onClose} title={order ? `Slip ${order.code}` : "Slip"}>
      {order && (
        <div className="overflow-y-auto">
          <OrderDetail key={order.code} order={order} showActions={false} />
        </div>
      )}
    </Drawer>
  );
}
