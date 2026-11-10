import type { ModeSidebar } from "@/lib/shell";
import { Brand } from "./Brand";
import { MobileNav } from "./MobileNav";
import { NavList } from "./NavList";
import { SidebarLipat } from "./SidebarLipat";
import type { StoreInfo } from "./StoreStatus";
import { StoreStatusToggle } from "./StoreStatusToggle";

/**
 * Rail ikon 64 px di 768–1279 (tombol atas membuka drawer berlabel), penuh 256 px di ≥ 1280 kecuali `mode` "ringkas"
 * (pilihan penjual dari cookie), disembunyikan di bawah 768 (diganti MobileNav). Butuh StoreStatusProvider bila `store` ada.
 */
export function Sidebar({ store, badge, admin = false, level, mode = "lebar" }: { store: StoreInfo | null; badge: number; admin?: boolean; level?: unknown; mode?: ModeSidebar }) {
  return (
    <SidebarLipat mode={mode} atas={<><Brand rail /><MobileNav rail store={store} badge={badge} admin={admin} level={level} /></>}>
      <div className="flex-1">
        <NavList rail badge={badge} admin={admin} level={level} />
      </div>
      {!admin && (
        <div className="border-t border-line pt-3">
          {store ? <StoreStatusToggle rail /> : <p className="hidden text-xs text-ink-muted sb-lebar:block">Status dapur tidak dapat dimuat.</p>}
        </div>
      )}
    </SidebarLipat>
  );
}
