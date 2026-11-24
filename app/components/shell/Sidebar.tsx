// Komponen Sidebar: navigasi kiri panel penjual/admin (logo, menu, status dapur).
// Dipakai layout app/(dashboard) dan app/(admin)/admin.
import type { SidebarMode } from "@/lib/shell";
import type { AdminQueues } from "@/types/admin";
import { Brand } from "./Brand";
import { MobileNav } from "./MobileNav";
import { NavList } from "./NavList";
import { CollapsibleSidebar } from "./CollapsibleSidebar";
import type { StoreInfo } from "./StoreStatus";
import { StoreStatusToggle } from "./StoreStatusToggle";

/**
 * Rail ikon 64 px di 768–1279 (tombol atas membuka drawer berlabel), penuh 256 px di ≥ 1280 kecuali `mode` "ringkas"
 * (pilihan penjual dari cookie), disembunyikan di bawah 768 (diganti MobileNav). Butuh StoreStatusProvider bila
 * `store` ada.
 * Rail = sidebar sempit berisi ikon saja (tablet 768–1279 px). `sb-lebar:` = varian Tailwind yang aktif saat sidebar
 * lebar.
 * @param props.store status dapur, atau null bila gagal dimuat
 * @param props.badge jumlah pesanan perlu tindakan
 * @param props.unreadNotifications jumlah notifikasi belum dibaca
 * @param props.unreadChats jumlah pesan pembeli belum dibaca di chat pesanan
 * @param props.admin panel admin (tanpa status dapur)
 * @param props.level tingkat admin untuk menyaring menu
 * @param props.queues hitungan antrean admin untuk lencana menu, atau null bila gagal dimuat
 * @param props.mode "lebar" atau "ringkas" dari cookie
 * @returns CollapsibleSidebar
 */
export function Sidebar({
  store,
  badge,
  unreadNotifications = 0,
  unreadChats = 0,
  admin = false,
  level,
  queues,
  mode = "lebar",
}: {
  store: StoreInfo | null;
  badge: number;
  unreadNotifications?: number;
  unreadChats?: number;
  admin?: boolean;
  level?: unknown;
  queues?: AdminQueues | null;
  mode?: SidebarMode;
}) {
  return (
    <CollapsibleSidebar
      mode={mode}
      topContent={
        <>
          <Brand rail />
          <MobileNav
            rail
            store={store}
            badge={badge}
            unreadNotifications={unreadNotifications}
            unreadChats={unreadChats}
            admin={admin}
            level={level}
            queues={queues}
          />
        </>
      }
    >
      <div className="flex-1">
        <NavList
          rail
          badge={badge}
          unreadNotifications={unreadNotifications}
          unreadChats={unreadChats}
          admin={admin}
          level={level}
          queues={queues}
        />
      </div>
      {!admin && (
        <div className="border-t border-line pt-3">
          {store ? (
            <StoreStatusToggle rail />
          ) : (
            <p className="hidden text-xs text-ink-muted sb-lebar:block">Status dapur tidak dapat dimuat.</p>
          )}
        </div>
      )}
    </CollapsibleSidebar>
  );
}
