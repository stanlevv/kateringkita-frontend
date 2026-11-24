// Layout semua halaman /meja (pesan dari meja oleh pembeli): wadah halaman, Toaster untuk pesan singkat, dan
// pendaftaran service worker. Layout adalah bingkai yang membungkus setiap page.tsx di folder ini dan di bawahnya.
// Area ini publik: tanpa login dan tidak dijaga proxy.ts. Tampilannya dibuat untuk HP; dashboard untuk layar lebar.
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Toaster } from "@/app/components/ui/Toast";
import { RegisterServiceWorker } from "./RegisterServiceWorker";

// Judul tab, tidak diindeks mesin pencari, dan pengaturan saat dipasang ke layar utama iPhone.
export const metadata: Metadata = {
  title: "Pesan dari meja",
  robots: { index: false, follow: false },
  appleWebApp: { capable: true, title: "KateringKita", statusBarStyle: "default" },
};
// Warna bilah status HP dan tampilan sampai tepi layar (viewport-fit=cover untuk HP berponi).
export const viewport: Viewport = { themeColor: "#FF6B35", viewportFit: "cover" };

/**
 * Bingkai halaman /meja.
 * @param props.children halaman /meja yang sedang dibuka
 * @returns wadah halaman berisi `children`, Toaster, dan RegisterServiceWorker
 */
export default function TableLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-1 flex-col bg-canvas text-ink">
      {children}
      <Toaster />
      <RegisterServiceWorker />
    </div>
  );
}
