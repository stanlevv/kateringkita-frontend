import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Header } from "@/app/components/shell/Header";
import { Sidebar } from "@/app/components/shell/Sidebar";
import { Toaster } from "@/app/components/ui/Toast";
import { requireAdmin } from "@/services/auth.service";
import { SIDEBAR_COOKIE, parseSidebarMode } from "@/lib/shell";
import { ForcedPasswordChange } from "./components/ForcedPasswordChange";

export const metadata: Metadata = { title: "Panel admin", robots: { index: false, follow: false } };

// F18 — shell admin. Data dari backend sungguhan, jadi tanpa banner "Data contoh" dan tanpa status dapur.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const [{ user }, cookieStore] = await Promise.all([requireAdmin(), cookies()]);
  return (
    <>
      <a
        href="#konten"
        className="sr-only z-50 rounded-md bg-surface px-4 py-2 font-medium text-primary focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus-visible:ring-2 focus-visible:ring-focus"
      >
        Lewati ke konten
      </a>
      <div className="flex min-h-dvh bg-canvas text-ink">
        <Sidebar
          admin
          level={user.admin_level}
          store={null}
          badge={0}
          mode={parseSidebarMode(cookieStore.get(SIDEBAR_COOKIE)?.value)}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <Header
            admin
            level={user.admin_level}
            userName={String(user.full_name ?? "Admin")}
            storeName="Admin"
            store={null}
            badge={0}
          />
          {/* Fase 1: akun dengan sandi sementara wajib ganti dulu; backend juga menolak /admin/* sampai diganti */}
          <main id="konten" tabIndex={-1} className="flex-1 p-4 md:p-6">
            {user.must_change_password ? <ForcedPasswordChange /> : children}
          </main>
        </div>
      </div>
      <Toaster />
    </>
  );
}
