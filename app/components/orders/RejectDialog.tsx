"use client";

import { ConfirmDialog } from "@/app/components/ui/ConfirmDialog";

// ConfirmDialog menambahkan "Lainnya" + isian teks sendiri.
const ALASAN = ["Stok habis", "Toko tutup", "Di luar jangkauan titik temu"];

/** DB-A1: tolak pesanan dengan alasan wajib. */
export function RejectDialog({ code, onClose, onConfirm }: { code: string | null; onClose: () => void; onConfirm: (reason: string) => void }) {
  return (
    <ConfirmDialog
      key={code ?? ""}
      open={!!code}
      onClose={onClose}
      title="Tolak pesanan?"
      body={`Pesanan ${code ?? ""} akan dibatalkan dan pembeli diberi tahu alasannya.`}
      confirmLabel="Tolak pesanan"
      tone="danger"
      reasons={ALASAN}
      requireReason
      onConfirm={(r) => r && onConfirm(r)}
    />
  );
}
