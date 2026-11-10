"use client";

import { ConfirmDialog } from "@/app/components/ui/ConfirmDialog";
import { formatRupiah } from "@/lib/format";
import type { MerchantOrder } from "@/types/order";

// ConfirmDialog menambahkan "Lainnya" + isian teks sendiri. Pesanan meja tidak memakai titik temu.
const ALASAN = ["Stok habis", "Toko tutup", "Di luar jangkauan titik temu"];
const ALASAN_MEJA = ["Stok habis", "Toko tutup"];

type Tolak = Pick<MerchantOrder, "code" | "payment_method" | "payment_status" | "total" | "table">;
const lunasNonTunai = (o: Tolak) => o.payment_method !== "cod" && o.payment_status === "paid";

/** DB-A1: tolak pesanan dengan alasan wajib. F26: VA/bayar online yang sudah lunas dikembalikan admin, bukan oleh toko. */
export function RejectDialog({ order, onClose, onConfirm }: { order: Tolak | null; onClose: () => void; onConfirm: (reason: string) => void }) {
  return (
    <ConfirmDialog
      key={order?.code ?? ""}
      open={!!order}
      onClose={onClose}
      title="Tolak pesanan?"
      body={
        <>
          <p>Pesanan {order?.code} akan dibatalkan dan pembeli diberi tahu alasannya.</p>
          {order && lunasNonTunai(order) && (
            <p className="mt-3 rounded-md bg-warning-bg px-3 py-2 text-warning">
              Pembeli sudah membayar {formatRupiah(order.total)} lewat Midtrans. Dana dikembalikan ke pembeli oleh admin KateringKita dan tidak masuk saldo pencairan toko.
            </p>
          )}
        </>
      }
      confirmLabel="Tolak pesanan"
      tone="danger"
      reasons={order?.table ? ALASAN_MEJA : ALASAN}
      requireReason
      onConfirm={(r) => r && onConfirm(r)}
    />
  );
}
