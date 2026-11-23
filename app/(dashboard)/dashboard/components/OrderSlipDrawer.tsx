// Komponen OrderSlipDrawer: laci samping berisi slip (rincian) satu pesanan. Dipakai OrderQueue.
// "use client": komponen ini berjalan di peramban (client component) karena memakai state, efek, atau router.
"use client";

import { Drawer } from "@/app/components/ui/Drawer";
import type { MerchantOrder } from "@/types/order";
import { OrderDetail } from "@/app/components/orders/OrderDetail";

/**
 * Laci slip pesanan, hanya baca: tombol aksi tidak ditampilkan karena kartu dashboard sudah punya tombol aksi.
 * @param props.order pesanan yang dilihat; null = laci tertutup
 * @param props.onClose menutup laci
 * @returns Drawer
 */
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
