// Bagian aksi pesanan yang dipakai bersama antrean dashboard (OrderQueue) dan detail pesanan (OrderDetail):
// cara menampilkan galat aksi, tautan Chat WA, tombol Tolak, dan dialog stok tidak cukup.
import { MessageCircle } from "lucide-react";
import { Button } from "@/app/components/ui/Button";
import { Dialog } from "@/app/components/ui/Dialog";
import { cx, focusRing } from "@/app/components/ui/cx";
import { actionTexts, type OrderAction } from "@/lib/order-status";

/**
 * Menentukan cara menampilkan galat dari server action orderAction.
 * OUT_OF_STOCK = kuota menu tidak cukup (tampilkan dialog stok); CONFLICT = status pesanan sudah berubah di server
 * (toast peringatan lalu muat ulang data); galat lain = toast gagal dengan teks tetap.
 * @param code kode galat dari backend
 * @param action aksi yang gagal (confirm, cook, ready, complete, reject)
 * @param message pesan galat dari server (dipakai untuk CONFLICT)
 * @returns `{ kind: "stok" }`, atau `{ kind: "toast", tone, message, reload }` (`reload` = perlu muat ulang data)
 */
export function actionErrorView(
  code: string,
  action: OrderAction,
  message?: string,
): { kind: "stok" } | { kind: "toast"; tone: "warning" | "danger"; message: string; reload: boolean } {
  if (code === "OUT_OF_STOCK") return { kind: "stok" };
  if (code === "CONFLICT")
    return { kind: "toast", tone: "warning", message: message || "Pesanan sudah berubah status", reload: true };
  return { kind: "toast", tone: "danger", message: actionTexts[action].failure, reload: false };
}

/**
 * Tautan Chat WA ke pembeli. Tautan menuju Route Handler (`/api/pesanan/<kode>/wa`) yang mengisi templat pesan toko
 * lalu mengalihkan ke wa.me; dibuka di tab baru.
 * @param props.code kode pesanan
 * @returns elemen `a`
 */
export function ChatWaLink({ code }: { code: string }) {
  return (
    <a
      href={`/api/pesanan/${encodeURIComponent(code)}/wa`}
      target="_blank"
      rel="noopener noreferrer"
      className={cx(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-line-strong bg-surface px-4 font-medium text-ink hover:bg-subtle",
        focusRing,
      )}
    >
      <MessageCircle aria-hidden className="size-4" />
      Chat WA
    </a>
  );
}

/**
 * Tombol Tolak pesanan (gaya sekunder, teks merah).
 * @param props.disabled nonaktif selama aksi lain berjalan
 * @param props.onClick membuka dialog alasan tolak
 * @returns Button
 */
export function RejectButton({ disabled, onClick }: { disabled?: boolean; onClick: () => void }) {
  return (
    <Button variant="secondary" className="text-danger" disabled={disabled} onClick={onClick}>
      Tolak
    </Button>
  );
}

/**
 * Dialog saat pesanan tidak bisa dikonfirmasi karena kuota menu tidak cukup: pilih tambah kuota atau tolak pesanan.
 * @param props.code kode pesanan; null = dialog tertutup
 * @param props.onClose menutup dialog
 * @param props.onReject membuka dialog tolak pesanan
 * @param props.onAddQuota membawa penjual ke pengaturan kuota
 * @returns Dialog
 */
export function OutOfStockDialog({
  code,
  onClose,
  onReject,
  onAddQuota,
}: {
  code: string | null;
  onClose: () => void;
  onReject: () => void;
  onAddQuota: () => void;
}) {
  return (
    <Dialog open={!!code} onClose={onClose} title="Stok tidak cukup untuk pesanan ini">
      <p className="text-ink-muted">
        Kuota menu di pesanan {code} sudah tidak mencukupi. Tambah kuota lalu konfirmasi lagi, atau tolak pesanan.
      </p>
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button variant="secondary" className="text-danger" onClick={onReject}>
          Tolak pesanan
        </Button>
        <Button onClick={onAddQuota}>Tambah kuota</Button>
      </div>
    </Dialog>
  );
}
