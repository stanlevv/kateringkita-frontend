"use client";

import { useState } from "react";
import { Menu, PanelLeftOpen } from "lucide-react";
import { Drawer } from "@/app/components/ui/Drawer";
import { IconButton } from "@/app/components/ui/IconButton";
import { NavList } from "./NavList";
import type { StoreInfo } from "./StoreStatus";
import { StoreStatusToggle } from "./StoreStatusToggle";

/**
 * Tombol yang membuka daftar navigasi yang sama dalam drawer: di header bawah 768 px, atau (`rail`) di rail 768–1279 px
 * sebagai drawer kiri. Hanya tombolnya yang disembunyikan per lebar layar, jadi drawer yang sedang terbuka tetap
 * tampil (dan bisa ditutup) saat tablet diputar.
 */
export function MobileNav({ store, badge, admin = false, level, rail = false }: { store: StoreInfo | null; badge: number; admin?: boolean; level?: unknown; rail?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className={rail ? "xl:hidden" : "md:hidden"}>
        <IconButton icon={rail ? PanelLeftOpen : Menu} label={rail ? "Lebarkan menu" : "Buka menu"} aria-expanded={open} onClick={() => setOpen(true)} />
      </div>
      <Drawer open={open} onClose={() => setOpen(false)} title="Menu" side={rail ? "kiri" : "kanan"}>
        <NavList badge={badge} onNavigate={() => setOpen(false)} admin={admin} level={level} />
        {store && !admin && (
          <div className="border-t border-line pt-3">
            <StoreStatusToggle />
          </div>
        )}
      </Drawer>
    </>
  );
}
