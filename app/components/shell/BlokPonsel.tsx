import { MonitorSmartphone } from "lucide-react";

// Aturan: dashboard penjual & admin hanya untuk tablet/desktop (lebar ≥ 768 px). Di bawah itu layar penuh ini menutup
// halaman. Hanya CSS (md:hidden), tanpa deteksi perangkat: tablet yang diputar ke lanskap langsung bisa dipakai.
export function BlokPonsel() {
  return (
    <div role="alertdialog" aria-modal="true" aria-labelledby="blok-ponsel-judul" aria-describedby="blok-ponsel-isi"
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4 bg-canvas p-6 text-center md:hidden">
      <style>{"@media (max-width: 767.98px) { body { overflow: hidden } }"}</style>
      <span className="flex size-16 items-center justify-center rounded-full bg-primary-soft">
        <MonitorSmartphone aria-hidden className="size-8 text-primary" />
      </span>
      <h1 id="blok-ponsel-judul" className="font-display text-xl font-semibold text-ink">Buka di tablet atau komputer</h1>
      <p id="blok-ponsel-isi" className="max-w-sm text-ink-muted">
        Dashboard KateringKita dirancang untuk layar lebar. Buka lewat tablet (bisa diputar ke mode lanskap) atau komputer.
      </p>
      <p className="max-w-sm text-sm text-ink-muted">Pelanggan yang ingin memesan cukup scan QR di meja.</p>
    </div>
  );
}
