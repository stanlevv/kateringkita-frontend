// Komponen AccountMenu: tombol nama pengguna di header yang membuka tautan Pengaturan akun dan tombol Keluar.
// Dipakai Header.
// "use client": komponen ini berjalan di peramban (client component) karena memakai state atau event.
"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, LogOut, UserCog } from "lucide-react";
import { logout } from "@/app/actions/auth";
import { cx, focusRing } from "@/app/components/ui/cx";
import { initials } from "@/lib/shell";

// Gaya tiap baris di panel menu.
const itemClass = cx(
  "flex min-h-11 w-full items-center gap-2 rounded-md px-3 text-sm text-ink hover:bg-subtle",
  focusRing,
);

/**
 * Menu akun berpola disclosure (tombol buka/tutup biasa, bukan role="menu"): tombol ber-`aria-expanded` (memberi tahu
 * pembaca layar panel terbuka atau tidak) + daftar biasa. Esc, klik di luar, dan Tab keluar menutup panel.
 * @param props.userName nama pengguna (inisial dan nama di tombol)
 * @param props.merchantName nama toko (atau "Admin")
 * @param props.admin panel admin: tautan akun ke /admin/akun
 * @returns elemen `div` berisi tombol dan panel
 */
export function AccountMenu({
  userName,
  merchantName,
  admin = false,
}: {
  userName: string;
  merchantName: string;
  admin?: boolean;
}) {
  // 1. Status buka, ref wadah (untuk deteksi klik luar) dan ref tombol (untuk mengembalikan fokus).
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  // 2. Selama terbuka, klik/sentuh di luar wadah menutup panel.
  useEffect(() => {
    if (!open) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, [open]);

  return (
    <div
      ref={containerRef}
      className="relative"
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) {
          setOpen(false);
          triggerRef.current?.focus();
        }
      }}
      onBlur={(event) => {
        if (open && !event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(!open)}
        className={cx("flex min-h-11 items-center gap-2 rounded-md px-2 hover:bg-subtle", focusRing)}
      >
        <span
          aria-hidden
          className="flex size-8 items-center justify-center rounded-full bg-primary-soft text-xs font-bold text-primary"
        >
          {initials(userName)}
        </span>
        <span className="hidden text-left leading-tight lg:block">
          <span className="block text-sm font-semibold text-ink">{userName}</span>
          <span className="block text-xs text-ink-muted">{merchantName}</span>
        </span>
        <span className="sr-only lg:hidden">{userName}</span>
        <ChevronDown aria-hidden className="size-4 text-ink-muted" />
      </button>
      {open && (
        <div
          id={panelId}
          className="absolute right-0 top-full z-30 mt-1 w-56 rounded-md border border-line bg-surface p-1 shadow-lg"
        >
          <Link href={admin ? "/admin/akun" : "/pengaturan#akun"} onClick={() => setOpen(false)} className={itemClass}>
            <UserCog aria-hidden className="size-4" />
            Pengaturan akun
          </Link>
          <hr className="my-1 border-line" />
          <form action={logout}>
            <button type="submit" className={cx(itemClass, "text-danger")}>
              <LogOut aria-hidden className="size-4" />
              Keluar
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
