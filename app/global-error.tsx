"use client";

// Galat di layout root (app/layout.tsx). "use client" wajib karena halaman galat Next berjalan di browser.
import "./globals.css";

/**
 * Halaman galat paling akhir, dipakai bila layout root sendiri gagal. Karena layout root ikut tergantikan,
 * halaman ini harus membawa <html> dan <body> sendiri.
 * @param props.retry fungsi dari Next untuk mencoba lagi
 * @returns dokumen HTML lengkap berisi pesan galat dan tombol Coba lagi
 */
export default function GlobalError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="id">
      <body className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-canvas p-6 text-center text-ink">
        <h1 className="text-2xl font-bold">Terjadi kesalahan</h1>
        <p className="max-w-sm text-ink-muted">KateringKita belum bisa dibuka. Coba lagi dalam beberapa saat.</p>
        <button
          type="button"
          onClick={() => retry()}
          className="min-h-11 rounded-md bg-accent px-4 font-semibold text-ink hover:bg-accent-pressed focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
        >
          Coba lagi
        </button>
      </body>
    </html>
  );
}
