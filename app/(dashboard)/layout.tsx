import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Header } from "@/app/components/shell/Header";
import { Sidebar } from "@/app/components/shell/Sidebar";
import { StoreStatusProvider, type StoreInfo } from "@/app/components/shell/StoreStatus";
import { StatusToko } from "@/app/components/StatusToko";
import { Toaster } from "@/app/components/ui/Toast";
import { getUnreadNotificationCount } from "@/services/notification.service";
import { getNeedsActionCount } from "@/services/order.service";
import { getProfile } from "@/services/profile.service";
import { requireMerchant } from "@/services/auth.service";
import { getMaintenance } from "@/services/meta.service";
import { HalamanPemeliharaan } from "@/app/components/Pemeliharaan";
import { SIDEBAR_COOKIE, parseSidebarMode } from "@/lib/shell";

export const metadata: Metadata = { title: "Dashboard penjual", robots: { index: false, follow: false } };

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, merchant } = await requireMerchant();
  // F27: API penjual dibalas 503 selama pemeliharaan, jadi shell diganti halaman pemberitahuan
  const pemeliharaan = await getMaintenance();
  if (pemeliharaan.aktif) return <HalamanPemeliharaan pesan={pemeliharaan.pesan} />;
  // Badge dan status dapur dihitung di layout, jadi hanya segar saat muat penuh atau router.refresh() (polling).
  const [profil, badge, notif, kuki] = await Promise.all([
    getProfile(),
    getNeedsActionCount(),
    getUnreadNotificationCount(),
    cookies(),
  ]);
  const store: StoreInfo | null =
    "data" in profil
      ? { isOpen: profil.data.is_open, buka: profil.data.open_time, tutup: profil.data.close_time }
      : null;
  const nama = String(user.full_name ?? "Penjual");
  const toko = String(merchant?.business_name ?? "");

  return (
    <StoreStatusProvider store={store}>
      <a
        href="#konten"
        className="sr-only z-50 rounded-md bg-surface px-4 py-2 font-medium text-primary focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus-visible:ring-2 focus-visible:ring-focus"
      >
        Lewati ke konten
      </a>
      <div className="flex min-h-dvh bg-canvas text-ink">
        <Sidebar store={store} badge={badge} notif={notif} mode={parseSidebarMode(kuki.get(SIDEBAR_COOKIE)?.value)} />
        <div className="flex min-w-0 flex-1 flex-col">
          <Header nama={nama} toko={toko} store={store} badge={badge} notif={notif} />
          <div className="px-4 pt-4 empty:hidden md:px-6">
            <StatusToko merchant={merchant} />
          </div>
          <main id="konten" tabIndex={-1} className="flex-1 p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
      <Toaster />
    </StoreStatusProvider>
  );
}
