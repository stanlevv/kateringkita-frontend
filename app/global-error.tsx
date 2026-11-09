"use client";

import "./globals.css";

// SY-4: pengganti layout root; harus membawa <html> dan <body> sendiri.
export default function GlobalError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="id">
      <body className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-canvas p-6 text-center text-ink">
        <h1 className="text-2xl font-bold">Terjadi kesalahan</h1>
        <p className="max-w-sm text-ink-muted">KateringKita belum bisa dibuka. Coba lagi dalam beberapa saat.</p>
        <button type="button" onClick={() => retry()} className="min-h-11 rounded-md bg-accent px-4 font-semibold text-ink hover:bg-accent-pressed focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2">
          Coba lagi
        </button>
      </body>
    </html>
  );
}
