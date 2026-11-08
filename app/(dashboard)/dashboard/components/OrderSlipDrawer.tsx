"use client";

import { Drawer } from "@/app/components/ui/Drawer";
import type { MerchantOrder } from "@/types/order";
import { OrderDetail } from "@/app/components/orders/OrderDetail";

// DB-N5. Hanya baca: kartu dashboard sudah punya aksi.
export function OrderSlipDrawer({ order: o, onClose }: { order: MerchantOrder | null; onClose: () => void }) {
  return (
    <Drawer open={!!o} onClose={onClose} title={o ? `Slip ${o.code}` : "Slip"}>
      {o && <div className="overflow-y-auto"><OrderDetail key={o.code} order={o} aksi={false} /></div>}
    </Drawer>
  );
}
