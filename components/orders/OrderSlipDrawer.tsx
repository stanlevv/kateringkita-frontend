"use client";

import { Drawer } from "@/components/ui/Drawer";
import type { MerchantOrder } from "@/lib/types";
import { OrderDetail } from "./OrderDetail";

// DB-N5. Hanya baca: kartu dashboard sudah punya aksi.
export function OrderSlipDrawer({ order: o, onClose }: { order: MerchantOrder | null; onClose: () => void }) {
  return (
    <Drawer open={!!o} onClose={onClose} title={o ? `Slip ${o.code}` : "Slip"}>
      {o && <div className="overflow-y-auto"><OrderDetail key={o.code} order={o} aksi={false} /></div>}
    </Drawer>
  );
}
