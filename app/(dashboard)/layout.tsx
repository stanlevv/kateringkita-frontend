import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Header } from "@/app/components/shell/Header";
import { Sidebar } from "@/app/components/shell/Sidebar";
import { StoreStatusProvider, type StoreInfo } from "@/app/components/shell/StoreStatus";
import { StatusToko } from "@/app/components/StatusToko";
import { Toaster } from "@/app/components/ui/Toast";
import { getJumlahTindakan } from "@/services/orderService";
import { getProfile } from "@/services/profileService";
import { requireMerchant } from "@/services/authService";
import { COOKIE_SIDEBAR, modeSidebar } from "@/lib/shell";

export const metadata: Metadata = { title: "Dashboard penjual", robots: { index: false, follow: false } };

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, merchant } = await requireMerchant();
  // Badge dan status dapur dihitung di layout, jadi hanya segar saat muat penuh atau router.refresh() (polling).
  const [profil, badge, kuki] = await Promise.all([getProfile(), getJumlahTindakan(), cookies()]);
  const store: StoreInfo | null = "data" in profil ? { isOpen: profil.data.is_open, buka: profil.data.open_time, tutup: profil.data.close_time } : null;
  const nama = String(user.full_name ?? "Penjual");
  const toko = String(merchant?.business_name ?? "");

  return (
    <StoreStatusProvider store={store}>
      <a href="#konten" className="sr-only z-50 rounded-md bg-surface px-4 py-2 font-medium text-primary focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus-visible:ring-2 focus-visible:ring-focus">
        Lewati ke konten
      </a>
      <div className="flex min-h-dvh bg-canvas text-ink">
        <Sidebar store={store} badge={badge} mode={modeSidebar(kuki.get(COOKIE_SIDEBAR)?.value)} />
        <div className="flex min-w-0 flex-1 flex-col">
          <Header nama={nama} toko={toko} store={store} badge={badge} />
          <div className="px-4 pt-4 empty:hidden md:px-6"><StatusToko merchant={merchant} /></div>
          <main id="konten" tabIndex={-1} className="flex-1 p-4 md:p-6">{children}</main>
        </div>
      </div>
      <Toaster />
    </StoreStatusProvider>
  );
}
