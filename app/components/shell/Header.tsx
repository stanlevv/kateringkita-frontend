// Komponen Header: bilah atas panel penjual/admin (tombol menu ponsel, cari pesanan, jam, menu akun).
// Dipakai layout app/(dashboard) dan app/(admin)/admin.
import { Search } from "lucide-react";
import { AccountMenu } from "./AccountMenu";
import { Clock } from "./Clock";
import { MobileNav } from "./MobileNav";
import type { StoreInfo } from "./StoreStatus";

/**
 * Bilah atas. Kotak cari adalah form GET biasa ke /pesanan?q=... sehingga tetap jalan tanpa JavaScript.
 * @param props.userName nama pengguna untuk menu akun
 * @param props.merchantName nama toko (atau "Admin")
 * @param props.store status dapur untuk drawer ponsel, atau null bila gagal dimuat
 * @param props.badge jumlah pesanan perlu tindakan
 * @param props.unreadNotifications jumlah notifikasi belum dibaca
 * @param props.admin panel admin (tanpa kotak cari)
 * @param props.level tingkat admin untuk menyaring menu
 * @returns elemen `header`
 */
export function Header({
  userName,
  merchantName,
  store,
  badge,
  unreadNotifications = 0,
  admin = false,
  level,
}: {
  userName: string;
  merchantName: string;
  store: StoreInfo | null;
  badge: number;
  unreadNotifications?: number;
  admin?: boolean;
  level?: unknown;
}) {
  return (
    <header className="sticky top-0 z-20 flex min-h-16 items-center gap-3 border-b border-line bg-surface px-4">
      <MobileNav store={store} badge={badge} unreadNotifications={unreadNotifications} admin={admin} level={level} />
      {!admin && (
        <form action="/pesanan" method="get" role="search" className="relative min-w-0 max-w-md flex-1">
          <label htmlFor="cari-pesanan" className="sr-only">
            Cari kode pesanan atau nama pemesan
          </label>
          <Search
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted"
          />
          <input
            id="cari-pesanan"
            name="q"
            type="search"
            placeholder="Cari kode atau nama pemesan"
            className="min-h-11 w-full rounded-md border border-line-strong bg-canvas pl-9 pr-3 text-sm text-ink placeholder:text-ink-muted focus-visible:ring-2 focus-visible:ring-focus"
          />
        </form>
      )}
      <div className="ml-auto flex items-center gap-3">
        <span className="hidden md:block">
          <Clock />
        </span>
        <AccountMenu userName={userName} merchantName={merchantName} admin={admin} />
      </div>
    </header>
  );
}
