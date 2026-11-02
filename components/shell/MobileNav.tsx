"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { IconButton } from "@/components/ui/IconButton";
import { NavList } from "./NavList";
import type { StoreInfo } from "./StoreStatus";
import { StoreStatusToggle } from "./StoreStatusToggle";

/** Di bawah 768 px: tombol menu yang membuka daftar navigasi yang sama dalam drawer. */
export function MobileNav({ store, badge, admin = false }: { store: StoreInfo | null; badge: number; admin?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="md:hidden">
      <IconButton icon={Menu} label="Buka menu" aria-expanded={open} onClick={() => setOpen(true)} />
      <Drawer open={open} onClose={() => setOpen(false)} title="Menu">
        <NavList badge={badge} onNavigate={() => setOpen(false)} admin={admin} />
        {store && !admin && (
          <div className="border-t border-line pt-3">
            <StoreStatusToggle />
          </div>
        )}
      </Drawer>
    </div>
  );
}
