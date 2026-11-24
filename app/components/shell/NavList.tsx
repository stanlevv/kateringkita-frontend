// Komponen NavList: daftar menu navigasi beserta badge angka. Dipakai Sidebar dan MobileNav.
// "use client": komponen ini berjalan di peramban (client component) karena memakai state atau event.
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx, focusRing } from "@/app/components/ui/cx";
import { canAccessPage } from "@/lib/admin-level";
import { MERCHANT_NAV, ADMIN_NAV } from "./nav";

/**
 * Daftar menu. Menu yang cocok dengan URL sekarang ditandai `aria-current="page"` (pembaca layar menyebutnya
 * halaman aktif). Angka badge punya teks tersembunyi ("3 belum dibaca") agar tidak hanya berupa angka.
 * Hanya berisi prop sederhana (angka/teks/boolean) karena dirender dari komponen server.
 * @param props.badge jumlah pesanan perlu tindakan
 * @param props.unreadNotifications jumlah notifikasi belum dibaca
 * @param props.unreadChats jumlah pesan pembeli belum dibaca di chat pesanan
 * @param props.rail hanya ikon (tooltip lewat title) kecuali sidebar sedang lebar; tanpa `rail` selalu penuh (drawer)
 * @param props.onNavigate dipanggil saat tautan diklik (menutup drawer)
 * @param props.admin pakai menu admin
 * @param props.level tingkat admin; menu khusus super disembunyikan untuk tingkat lain
 * @returns elemen `nav`
 */
export function NavList({
  badge = 0,
  unreadNotifications = 0,
  unreadChats = 0,
  rail = false,
  onNavigate,
  admin = false,
  level,
}: {
  badge?: number;
  unreadNotifications?: number;
  unreadChats?: number;
  rail?: boolean;
  onNavigate?: () => void;
  admin?: boolean;
  level?: unknown;
}) {
  // Menu admin disaring per tingkat; menu penjual dipakai apa adanya.
  const nav = admin
    ? ADMIN_NAV.map((group) => ({ ...group, items: group.items.filter((item) => canAccessPage(level, item.href)) }))
    : MERCHANT_NAV;
  const path = usePathname();
  const labelClass = rail ? "hidden sb-lebar:inline" : "";
  return (
    <nav aria-label="Menu utama" className="flex flex-col gap-4">
      {nav.map((group) => (
        <div key={group.title}>
          <h2
            className={cx(
              "px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-ink-muted",
              rail && "hidden sb-lebar:block",
            )}
          >
            {group.title}
          </h2>
          {rail && <hr className="mx-3 border-line sb-lebar:hidden" />}
          <ul className="flex flex-col gap-1">
            {group.items.map(({ href, label, icon: Icon, badge: badgeKind, exact }) => {
              const active = path === href || (!exact && path.startsWith(`${href}/`));
              const count =
                badgeKind === "notifications"
                  ? unreadNotifications
                  : badgeKind === "chats"
                    ? unreadChats
                    : badgeKind
                      ? badge
                      : 0;
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={onNavigate}
                    title={label}
                    aria-current={active ? "page" : undefined}
                    className={cx(
                      "relative flex min-h-11 items-center gap-3 rounded-md border-l-4 px-3 text-sm",
                      rail && "justify-center sb-lebar:justify-start",
                      active
                        ? "border-accent bg-primary-soft font-semibold text-primary"
                        : "border-transparent text-ink hover:bg-subtle",
                      focusRing,
                    )}
                  >
                    <Icon aria-hidden className="size-5 shrink-0" />
                    <span className={cx("flex-1", labelClass)}>{label}</span>
                    {count > 0 && (
                      <span
                        className={cx(
                          "min-w-5 rounded-full bg-warning-bg px-1.5 text-center text-xs font-bold text-warning",
                          rail && "absolute right-0 top-0 sb-lebar:static",
                        )}
                      >
                        <span aria-hidden>{count}</span>
                        <span className="sr-only">
                          {count}{" "}
                          {badgeKind === "notifications"
                            ? "belum dibaca"
                            : badgeKind === "chats"
                              ? "chat belum dibaca"
                              : "perlu tindakan"}
                        </span>
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
