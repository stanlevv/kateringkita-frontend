// Layout semua halaman penjual (/dashboard, /pesanan, /menu, /pengaturan, dan lainnya): sidebar, header, banner
// verifikasi toko dan verifikasi email, pemberitahuan pesan baru dari pembeli (ChatNotifier), dan area konten.
// Layout = file khusus Next.js yang membungkus semua halaman di folder ini.
// Ini server component (tanpa "use client"): dijalankan di server dan boleh memanggil services langsung.
// Data: sesi penjual (requireMerchant), status pemeliharaan, profil toko, jumlah pesanan perlu tindakan, jumlah
// notifikasi belum dibaca, jumlah pesan chat belum dibaca, dan cookie lebar sidebar.
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { ChatNotifier } from "@/app/components/shell/ChatNotifier";
import { Header } from "@/app/components/shell/Header";
import { Sidebar } from "@/app/components/shell/Sidebar";
import { StoreStatusProvider, type StoreInfo } from "@/app/components/shell/StoreStatus";
import { VerificationBanner } from "@/app/components/VerificationBanner";
import { EmailVerificationBanner } from "@/app/components/EmailVerificationBanner";
import { Toaster } from "@/app/components/ui/Toast";
import { getUnreadNotificationCount } from "@/services/notification.service";
import { getNeedsActionCount } from "@/services/order.service";
import { getUnreadChatCount } from "@/services/order-chat.service";
import { getProfile } from "@/services/profile.service";
import { requireMerchant } from "@/services/auth.service";
import { getMaintenance } from "@/services/meta.service";
import { MaintenanceNotice } from "@/app/components/MaintenanceNotice";
import { SIDEBAR_COOKIE, parseSidebarMode } from "@/lib/shell";

/** Metadata halaman penjual: judul tetap dan tidak boleh diindeks mesin pencari. */
export const metadata: Metadata = { title: "Dashboard penjual", robots: { index: false, follow: false } };

/**
 * Membungkus halaman penjual dengan sidebar, header, dan banner verifikasi. Saat pemeliharaan aktif, seluruh shell
 * diganti halaman pemberitahuan.
 * @param props.children halaman yang sedang dibuka
 * @returns shell dashboard di dalam StoreStatusProvider (status dapur bersama) dan ChatNotifier (pemberitahuan pesan
 *   pembeli), atau MaintenanceNotice
 */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // 1. Pastikan yang masuk adalah penjual. Bila belum masuk atau bukan penjual, requireMerchant memanggil redirect()
  // (pindah ke halaman login atau panel admin) dan baris berikutnya tidak dijalankan.
  const { user, merchant } = await requireMerchant();
  // 2. Selama pemeliharaan, API penjual dibalas 503, jadi shell diganti halaman pemberitahuan.
  const maintenance = await getMaintenance();
  if (maintenance.aktif) return <MaintenanceNotice message={maintenance.pesan} />;
  // 3. Ambil data shell sekaligus. Badge dan status dapur dihitung di layout, jadi hanya diperbarui saat halaman
  // dimuat penuh atau saat router.refresh() dipanggil (dashboard memanggilnya ketika jumlah pesanan atau jumlah chat
  // belum dibaca berubah; panel chat memanggilnya setelah menandai pesan dibaca).
  const [profile, badge, unreadNotifications, unreadChats, cookieStore] = await Promise.all([
    getProfile(),
    getNeedsActionCount(),
    getUnreadNotificationCount(),
    getUnreadChatCount(),
    cookies(),
  ]);
  // 4. Susun status dapur, nama pengguna, dan nama toko untuk sidebar dan header.
  const store: StoreInfo | null =
    "data" in profile
      ? { isOpen: profile.data.is_open, openTime: profile.data.open_time, closeTime: profile.data.close_time }
      : null;
  const userName = String(user.full_name ?? "Penjual");
  const merchantName = String(merchant?.business_name ?? "");

  return (
    <StoreStatusProvider store={store}>
      <ChatNotifier>
        <a
          href="#konten"
          className="sr-only z-50 rounded-md bg-surface px-4 py-2 font-medium text-primary focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus-visible:ring-2 focus-visible:ring-focus"
        >
          Lewati ke konten
        </a>
        <div className="flex min-h-dvh bg-canvas text-ink">
          <Sidebar
            store={store}
            badge={badge}
            unreadNotifications={unreadNotifications}
            unreadChats={unreadChats}
            mode={parseSidebarMode(cookieStore.get(SIDEBAR_COOKIE)?.value)}
          />
          <div className="flex min-w-0 flex-1 flex-col">
            <Header
              userName={userName}
              merchantName={merchantName}
              store={store}
              badge={badge}
              unreadNotifications={unreadNotifications}
              unreadChats={unreadChats}
            />
            <div className="flex flex-col gap-3 px-4 pt-4 empty:hidden md:px-6">
              <VerificationBanner merchant={merchant} />
              <EmailVerificationBanner user={user} />
            </div>
            <main id="konten" tabIndex={-1} className="flex-1 p-4 md:p-6">
              {children}
            </main>
          </div>
        </div>
        <Toaster />
      </ChatNotifier>
    </StoreStatusProvider>
  );
}
