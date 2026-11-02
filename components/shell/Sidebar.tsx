import { Brand } from "./Brand";
import { NavList } from "./NavList";
import type { StoreInfo } from "./StoreStatus";
import { StoreStatusToggle } from "./StoreStatusToggle";

/** Penuh ≥ 1280 px (256), rail ikon 64 px di 768–1279, disembunyikan di bawah 768 (diganti MobileNav). Butuh StoreStatusProvider bila `store` ada. */
export function Sidebar({ store, badge, admin = false }: { store: StoreInfo | null; badge: number; admin?: boolean }) {
  return (
    <aside className="sticky top-0 hidden h-dvh w-16 shrink-0 flex-col gap-4 overflow-y-auto border-r border-line bg-surface p-2 md:flex xl:w-64 xl:p-3">
      <Brand rail />
      <div className="flex-1">
        <NavList rail badge={badge} admin={admin} />
      </div>
      {!admin && (
        <div className="border-t border-line pt-3">
          {store ? <StoreStatusToggle rail /> : <p className="hidden text-xs text-ink-muted xl:block">Status dapur tidak dapat dimuat.</p>}
        </div>
      )}
    </aside>
  );
}
