"use client";

import { useState, type ReactNode } from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { IconButton } from "@/app/components/ui/IconButton";
import { COOKIE_SIDEBAR, type ModeSidebar } from "@/lib/shell";

/**
 * SH-N1: bingkai sidebar. Di ≥ 1280 px tombolnya menciutkan/melebarkan sidebar dan pilihan disimpan di cookie
 * setahun. Lebar diganti seketika (tanpa animasi width) supaya konten tidak reflow berkali-kali.
 */
export function SidebarLipat({ mode: awal, atas, children }: { mode: ModeSidebar; atas: ReactNode; children: ReactNode }) {
  const [mode, setMode] = useState(awal);
  const lebar = mode === "lebar";
  function ubah() {
    const baru = lebar ? "ringkas" : "lebar";
    setMode(baru);
    document.cookie = `${COOKIE_SIDEBAR}=${baru}; path=/; max-age=31536000; samesite=lax`;
  }
  return (
    <aside data-sidebar={mode} className="sticky top-0 hidden h-dvh w-16 shrink-0 flex-col gap-4 overflow-y-auto border-r border-line bg-surface p-2 md:flex sb-lebar:w-64 sb-lebar:p-3">
      <div className="flex flex-col items-center gap-2 sb-lebar:flex-row sb-lebar:justify-between">
        {atas}
        <div className="hidden xl:block">
          <IconButton icon={lebar ? PanelLeftClose : PanelLeftOpen} label={lebar ? "Ciutkan menu" : "Lebarkan menu"} onClick={ubah} />
        </div>
      </div>
      {children}
    </aside>
  );
}
