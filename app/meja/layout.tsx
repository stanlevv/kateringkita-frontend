import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Toaster } from "@/app/components/ui/Toast";
import { DaftarSw } from "./DaftarSw";

// F21: area publik pelanggan (tanpa login, di luar matcher proxy). Ramah HP; dashboard tetap untuk layar lebar.
export const metadata: Metadata = {
  title: "Pesan dari meja",
  robots: { index: false, follow: false },
  appleWebApp: { capable: true, title: "KateringKita", statusBarStyle: "default" },
};
export const viewport: Viewport = { themeColor: "#FF6B35", viewportFit: "cover" };

export default function MejaLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-1 flex-col bg-canvas text-ink">
      {children}
      <Toaster />
      <DaftarSw />
    </div>
  );
}
