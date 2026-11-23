import type { ReactNode } from "react";
import { ScanLine } from "lucide-react";

// Layar pesan tunggal halaman meja (QR tidak aktif, gagal muat, petunjuk scan)
export function MejaPesan({ judul, isi, aksi }: { judul: string; isi: string; aksi?: ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-primary-soft">
        <ScanLine aria-hidden className="size-8 text-primary" />
      </span>
      <h1 className="font-display text-xl font-semibold">{judul}</h1>
      <p className="text-ink-muted">{isi}</p>
      {aksi}
    </main>
  );
}
