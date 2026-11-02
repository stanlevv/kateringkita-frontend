"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, LogOut, UserCog } from "lucide-react";
import { logout } from "@/app/actions/auth";
import { cx, fokus } from "@/components/ui/cx";
import { inisial } from "@/lib/shell";

const item = cx("flex min-h-11 w-full items-center gap-2 rounded-md px-3 text-sm text-ink hover:bg-subtle", fokus);

// Disclosure (bukan role menu): tombol aria-expanded + daftar biasa; Esc, klik luar, dan Tab keluar menutup.
export function AccountMenu({ nama, toko, admin = false }: { nama: string; toko: string; admin?: boolean }) {
  const [open, setOpen] = useState(false);
  const wadah = useRef<HTMLDivElement>(null);
  const pemicu = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const tutup = (e: PointerEvent) => { if (!wadah.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("pointerdown", tutup);
    return () => document.removeEventListener("pointerdown", tutup);
  }, [open]);

  return (
    <div
      ref={wadah}
      className="relative"
      onKeyDown={(e) => {
        if (e.key === "Escape" && open) {
          setOpen(false);
          pemicu.current?.focus();
        }
      }}
      onBlur={(e) => { if (open && !e.currentTarget.contains(e.relatedTarget as Node | null)) setOpen(false); }}
    >
      <button
        ref={pemicu}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(!open)}
        className={cx("flex min-h-11 items-center gap-2 rounded-md px-2 hover:bg-subtle", fokus)}
      >
        <span aria-hidden className="flex size-8 items-center justify-center rounded-full bg-primary-soft text-xs font-bold text-primary">{inisial(nama)}</span>
        <span className="hidden text-left leading-tight lg:block">
          <span className="block text-sm font-semibold text-ink">{nama}</span>
          <span className="block text-xs text-ink-muted">{toko}</span>
        </span>
        <span className="sr-only lg:hidden">{nama}</span>
        <ChevronDown aria-hidden className="size-4 text-ink-muted" />
      </button>
      {open && (
        <div id={panelId} className="absolute right-0 top-full z-30 mt-1 w-56 rounded-md border border-line bg-surface p-1 shadow-lg">
          {!admin && (
            <>
              <Link href="/pengaturan#akun" onClick={() => setOpen(false)} className={item}>
                <UserCog aria-hidden className="size-4" />
                Pengaturan akun
              </Link>
              <hr className="my-1 border-line" />
            </>
          )}
          <form action={logout}>
            <button type="submit" className={cx(item, "text-danger")}>
              <LogOut aria-hidden className="size-4" />
              Keluar
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
