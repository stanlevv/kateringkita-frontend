// Komponen RejectDialog: dialog tolak pesanan dengan alasan wajib. Dipakai antrean dashboard dan detail pesanan.
// "use client": komponen ini berjalan di peramban (client component) karena memakai state, efek, atau router.
"use client";

import { ConfirmDialog } from "@/app/components/ui/ConfirmDialog";
import { formatRupiah } from "@/lib/format";
import type { MerchantOrder } from "@/types/order";

// Pilihan alasan siap pakai. ConfirmDialog menambahkan pilihan "Lainnya" dengan isian teks sendiri.
// Pesanan meja tidak memakai titik temu, jadi alasan jangkauan titik temu tidak ditawarkan.
const REJECT_REASONS = ["Stok habis", "Toko tutup", "Di luar jangkauan titik temu"];
const TABLE_REJECT_REASONS = ["Stok habis", "Toko tutup"];

/** Bagian data pesanan yang dibutuhkan dialog. */
type RejectableOrder = Pick<MerchantOrder, "code" | "payment_method" | "payment_status" | "total" | "table">;
/** Sudah lunas lewat pembayaran online di Midtrans (QRIS, VA, atau metode online lain), bukan tunai di tempat. */
const isPaidOnline = (order: RejectableOrder) => order.payment_method !== "cod" && order.payment_status === "paid";

/**
 * Dialog tolak pesanan; tombol Tolak aktif setelah alasan dipilih. Bila pembeli sudah membayar online, dialog
 * memberi tahu bahwa dana dikembalikan oleh admin KateringKita, bukan oleh toko.
 * @param props.order pesanan yang akan ditolak; null = dialog tertutup
 * @param props.onClose menutup dialog
 * @param props.onConfirm dipanggil dengan alasan yang dipilih
 * @returns ConfirmDialog
 */
export function RejectDialog({
  order,
  onClose,
  onConfirm,
}: {
  order: RejectableOrder | null;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}) {
  return (
    <ConfirmDialog
      key={order?.code ?? ""}
      open={!!order}
      onClose={onClose}
      title="Tolak pesanan?"
      body={
        <>
          <p>Pesanan {order?.code} akan dibatalkan dan pembeli diberi tahu alasannya.</p>
          {order && isPaidOnline(order) && (
            <p className="mt-3 rounded-md bg-warning-bg px-3 py-2 text-warning">
              Pembeli sudah membayar {formatRupiah(order.total)} lewat Midtrans. Dana dikembalikan ke pembeli oleh admin
              KateringKita dan tidak masuk saldo pencairan toko.
            </p>
          )}
        </>
      }
      confirmLabel="Tolak pesanan"
      tone="danger"
      reasons={order?.table ? TABLE_REJECT_REASONS : REJECT_REASONS}
      requireReason
      onConfirm={(reason) => reason && onConfirm(reason)}
    />
  );
}
