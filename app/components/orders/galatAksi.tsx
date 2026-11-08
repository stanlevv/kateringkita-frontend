import { MessageCircle } from "lucide-react";
import { Button } from "@/app/components/ui/Button";
import { Dialog } from "@/app/components/ui/Dialog";
import { cx, fokus } from "@/app/components/ui/cx";
import { teksAksi, type AksiPesanan } from "@/lib/order-status";

/** Cara menampilkan galat orderAction; dipakai antrean dashboard dan detail pesanan. */
export function galatAksi(kode: string, aksi: AksiPesanan, pesan?: string):
  | { jenis: "stok" }
  | { jenis: "toast"; tone: "warning" | "danger"; message: string; muatUlang: boolean } {
  if (kode === "OUT_OF_STOCK") return { jenis: "stok" };
  if (kode === "CONFLICT") return { jenis: "toast", tone: "warning", message: pesan || "Pesanan sudah berubah status", muatUlang: true };
  return { jenis: "toast", tone: "danger", message: teksAksi[aksi].gagal, muatUlang: false };
}

/** M-04, M-11: lewat Route Handler yang mengisi templat pesan toko lalu membuka wa.me. */
export function ChatWaLink({ code }: { code: string }) {
  return (
    <a href={`/api/pesanan/${encodeURIComponent(code)}/wa`} target="_blank" rel="noopener noreferrer"
      className={cx("inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-line-strong bg-surface px-4 font-medium text-ink hover:bg-subtle", fokus)}>
      <MessageCircle aria-hidden className="size-4" />Chat WA
    </a>
  );
}

export function TombolTolak({ disabled, onClick }: { disabled?: boolean; onClick: () => void }) {
  return <Button variant="secondary" className="text-danger" disabled={disabled} onClick={onClick}>Tolak</Button>;
}

/** Stok tidak cukup saat konfirmasi (DB-E2). */
export function StokDialog({ code, onClose, onTolak, onTambah }: { code: string | null; onClose: () => void; onTolak: () => void; onTambah: () => void }) {
  return (
    <Dialog open={!!code} onClose={onClose} title="Stok tidak cukup untuk pesanan ini">
      <p className="text-ink-muted">Kuota menu di pesanan {code} sudah tidak mencukupi. Tambah kuota lalu konfirmasi lagi, atau tolak pesanan.</p>
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button variant="secondary" className="text-danger" onClick={onTolak}>Tolak pesanan</Button>
        <Button onClick={onTambah}>Tambah kuota</Button>
      </div>
    </Dialog>
  );
}
