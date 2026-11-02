import { Header } from "@/components/shell/Header";
import { Sidebar } from "@/components/shell/Sidebar";
import { Toaster } from "@/components/ui/Toast";
import { requireAdmin } from "@/lib/session";

// F18 — shell admin. Data dari backend sungguhan, jadi tanpa banner "Data contoh" dan tanpa status dapur.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireAdmin();
  return (
    <>
      <a href="#konten" className="sr-only z-50 rounded-md bg-surface px-4 py-2 font-medium text-primary focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus-visible:ring-2 focus-visible:ring-focus">
        Lewati ke konten
      </a>
      <div className="flex min-h-dvh bg-canvas text-ink">
        <Sidebar admin store={null} badge={0} />
        <div className="flex min-w-0 flex-1 flex-col">
          <Header admin nama={String(user.full_name ?? "Admin")} toko="Admin" store={null} badge={0} />
          <main id="konten" tabIndex={-1} className="flex-1 p-4 md:p-6">{children}</main>
        </div>
      </div>
      <Toaster />
    </>
  );
}
