// Komponen CollapsibleSidebar: bingkai sidebar yang bisa diciutkan/dilebarkan; pilihannya disimpan di cookie.
// Dipakai Sidebar.
// "use client": komponen ini berjalan di peramban (client component) karena memakai state atau event.
"use client";

import { useState, type ReactNode } from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { IconButton } from "@/app/components/ui/IconButton";
import { SIDEBAR_COOKIE, type SidebarMode } from "@/lib/shell";

/**
 * Bingkai sidebar. Di ≥ 1280 px tombolnya menciutkan/melebarkan sidebar dan pilihan disimpan setahun di cookie
 * `kk-sidebar` (data kecil di peramban yang ikut terkirim ke server, sehingga layout server langsung merender lebar
 * yang benar tanpa kedip). Nilai cookie "lebar"/"ringkas" tetap karena dibaca layout server dan varian CSS `sb-lebar:`.
 * Lebar diganti seketika (tanpa animasi width) supaya konten tidak reflow berkali-kali.
 * @param props.mode mode awal dari cookie ("lebar" atau "ringkas")
 * @param props.topContent isi bagian atas (logo dan tombol menu)
 * @param props.children isi sidebar (daftar menu, status dapur)
 * @returns elemen `aside`
 */
export function CollapsibleSidebar({
  mode: initialMode,
  topContent,
  children,
}: {
  mode: SidebarMode;
  topContent: ReactNode;
  children: ReactNode;
}) {
  // 1. Mode berjalan di state, mulai dari nilai cookie yang dibaca server.
  const [mode, setMode] = useState(initialMode);
  const isWide = mode === "lebar";
  // 2. Tombol menukar mode lalu menulis cookie setahun agar render server berikutnya langsung memakai mode ini.
  function toggleMode() {
    const nextMode = isWide ? "ringkas" : "lebar";
    setMode(nextMode);
    document.cookie = `${SIDEBAR_COOKIE}=${nextMode}; path=/; max-age=31536000; samesite=lax`;
  }
  return (
    <aside
      data-sidebar={mode}
      className="sticky top-0 hidden h-dvh w-16 shrink-0 flex-col gap-4 overflow-y-auto border-r border-line bg-surface p-2 md:flex sb-lebar:w-64 sb-lebar:p-3"
    >
      <div className="flex flex-col items-center gap-2 sb-lebar:flex-row sb-lebar:justify-between">
        {topContent}
        <div className="hidden xl:block">
          <IconButton
            icon={isWide ? PanelLeftClose : PanelLeftOpen}
            label={isWide ? "Ciutkan menu" : "Lebarkan menu"}
            onClick={toggleMode}
          />
        </div>
      </div>
      {children}
    </aside>
  );
}
