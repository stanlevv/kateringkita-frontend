"use client";

import { useState, type ReactNode } from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { IconButton } from "@/app/components/ui/IconButton";
import { SIDEBAR_COOKIE, type SidebarMode } from "@/lib/shell";

/**
 * SH-N1: bingkai sidebar. Di ≥ 1280 px tombolnya menciutkan/melebarkan sidebar dan pilihan disimpan di cookie
 * setahun. Lebar diganti seketika (tanpa animasi width) supaya konten tidak reflow berkali-kali.
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
  const [mode, setMode] = useState(initialMode);
  const isWide = mode === "lebar";
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
