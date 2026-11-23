import { MessageCircle } from "lucide-react";
import { Button } from "@/app/components/ui/Button";
import { Dialog } from "@/app/components/ui/Dialog";
import { cx, focusRing } from "@/app/components/ui/cx";
import { actionTexts, type OrderAction } from "@/lib/order-status";

/** Cara menampilkan galat orderAction; dipakai antrean dashboard dan detail pesanan. */
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

/** M-04, M-11: lewat Route Handler yang mengisi templat pesan toko lalu membuka wa.me. */
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

export function RejectButton({ disabled, onClick }: { disabled?: boolean; onClick: () => void }) {
  return (
    <Button variant="secondary" className="text-danger" disabled={disabled} onClick={onClick}>
      Tolak
    </Button>
  );
}

/** Stok tidak cukup saat konfirmasi (DB-E2). */
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
