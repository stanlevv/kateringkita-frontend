import Link from "next/link";
import { SearchX } from "lucide-react";

const tautan = "inline-flex min-h-11 items-center justify-center rounded-md px-4 font-medium focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-canvas p-6 text-center text-ink">
      <SearchX aria-hidden className="size-12 text-ink-muted" />
      <h1 className="text-2xl font-bold">Halaman tidak ditemukan</h1>
      <p className="max-w-sm text-ink-muted">Alamat yang Anda buka tidak ada atau sudah dipindahkan.</p>
      <div className="mt-2 flex flex-col gap-3 sm:flex-row">
        <Link href="/dashboard" className={`${tautan} bg-primary text-surface hover:bg-primary-pressed`}>Ke Dashboard</Link>
        <Link href="/" className={`${tautan} border border-line-strong bg-surface hover:bg-subtle`}>Ke Beranda</Link>
      </div>
    </main>
  );
}
