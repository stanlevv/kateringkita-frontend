// Komponen NavList: daftar menu navigasi beserta badge angka. Dipakai Sidebar dan MobileNav.
// "use client": komponen ini berjalan di peramban (client component) karena memakai state atau event.
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx, focusRing } from "@/app/components/ui/cx";
import { canAccessPage } from "@/lib/admin-level";
import type { AdminQueues } from "@/types/admin";
import { MERCHANT_NAV, ADMIN_NAV } from "./nav";

/** Teks pembaca layar sesudah angka badge, per jenis badge (`badge` di nav.ts; `true` = "actions"). */
const BADGE_SR_LABEL = {
  actions: "perlu tindakan",
  notifications: "belum dibaca",
  chats: "pesan chat belum dibaca",
  merchants_pending: "penjual menunggu verifikasi",
  tickets_open: "tiket menunggu balasan",
  chats_reported: "laporan chat belum dibuka",
  ai_results_pending: "hasil AI menunggu",
  payouts: "pencairan dan refund menunggu",
} as const;

/**
 * Daftar menu. Menu yang cocok dengan URL sekarang ditandai `aria-current="page"` (pembaca layar menyebutnya
 * halaman aktif). Angka badge punya teks tersembunyi (lihat BADGE_SR_LABEL) agar tidak hanya berupa angka; di atas 99
 * tampil "99+" (rail hanya selebar 64 px) dan teks tersembunyinya tetap angka asli.
 * Hanya berisi prop sederhana (angka/teks/boolean, plus `queues` berupa objek datar angka) karena dirender dari
 * komponen server.
 * @param props.badge jumlah pesanan perlu tindakan
 * @param props.unreadNotifications jumlah notifikasi belum dibaca
 * @param props.unreadChats jumlah pesan pembeli belum dibaca di chat pesanan
 * @param props.rail hanya ikon (tooltip lewat title) kecuali sidebar sedang lebar; tanpa `rail` selalu penuh (drawer)
 * @param props.onNavigate dipanggil saat tautan diklik (menutup drawer)
 * @param props.admin pakai menu admin
 * @param props.level tingkat admin; menu khusus super disembunyikan untuk tingkat lain
 * @param props.queues hitungan antrean admin untuk lencana menu; null/kosong = tanpa lencana antrean
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
  queues,
}: {
  badge?: number;
  unreadNotifications?: number;
  unreadChats?: number;
  rail?: boolean;
  onNavigate?: () => void;
  admin?: boolean;
  level?: unknown;
  queues?: AdminQueues | null;
}) {
  // Menu admin disaring per tingkat, lalu kelompok yang kosong dibuang; menu penjual dipakai apa adanya.
  const nav = admin
    ? ADMIN_NAV.map((group) => ({
        ...group,
        items: group.items.filter((item) => canAccessPage(level, item.href)),
      })).filter((group) => group.items.length > 0)
    : MERCHANT_NAV;
  const path = usePathname();
  const labelClass = rail ? "hidden sb-lebar:inline" : "";
  const badgeCounts = {
    actions: badge,
    notifications: unreadNotifications,
    chats: unreadChats,
    merchants_pending: queues?.merchants_pending,
    tickets_open: queues?.tickets_open,
    chats_reported: queues?.chats_reported,
    ai_results_pending: queues?.ai_results_pending,
    payouts: (queues?.payouts_pending ?? 0) + (queues?.refunds_pending ?? 0),
  };
  return (
    <nav aria-label="Menu utama" className="flex flex-col gap-4">
      {nav.map((group) => (
        <div key={group.title}>
          {/* Judul kosong tidak dirender: heading kosong mengganggu pembaca layar. */}
          {group.title && (
            <h2
              className={cx(
                "px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-ink-muted",
                rail && "hidden sb-lebar:block",
              )}
            >
              {group.title}
            </h2>
          )}
          {rail && <hr className="mx-3 border-line sb-lebar:hidden" />}
          <ul className="flex flex-col gap-1">
            {group.items.map(({ href, label, icon: Icon, badge: badgeKind, exact }) => {
              const active = path === href || (!exact && path.startsWith(`${href}/`));
              const badgeKey = badgeKind === true ? "actions" : badgeKind || undefined;
              const count = badgeKey ? (badgeCounts[badgeKey] ?? 0) : 0;
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
                    {badgeKey && count > 0 && (
                      <span
                        className={cx(
                          "min-w-5 rounded-full bg-warning-bg px-1.5 text-center text-xs font-bold text-warning",
                          rail && "absolute right-0 top-0 sb-lebar:static",
                        )}
                      >
                        <span aria-hidden>{count > 99 ? "99+" : count}</span>
                        <span className="sr-only">
                          {count} {BADGE_SR_LABEL[badgeKey]}
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
