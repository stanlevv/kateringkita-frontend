// Komponen TableMessage: layar berisi satu pesan untuk halaman /meja, mis. QR tidak aktif, menu gagal dimuat, pesanan
// tidak bisa dibuka, atau petunjuk memindai QR. Tidak mengambil data; isinya diberikan pemanggil.
import type { ReactNode } from "react";
import { ScanLine } from "lucide-react";

/**
 * Layar pesan satu kolom dengan ikon pindai di atas.
 * @param props.title judul pesan
 * @param props.body penjelasan di bawah judul
 * @param props.action tombol atau komponen tambahan di bawah penjelasan (opsional)
 * @returns elemen `<main>` berisi pesan
 */
export function TableMessage({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-primary-soft">
        <ScanLine aria-hidden className="size-8 text-primary" />
      </span>
      <h1 className="font-display text-xl font-semibold">{title}</h1>
      <p className="text-ink-muted">{body}</p>
      {action}
    </main>
  );
}
